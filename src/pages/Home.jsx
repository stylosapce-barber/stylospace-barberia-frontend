import { useState, useEffect } from 'react'
import { getServicios, getDisponibilidad, reservarTurno } from '../lib/api'

const STEPS = ['Servicio', 'Turno', 'Datos', 'Confirmar']
const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

function getProximosDias(n = 14) {
  const dias = []
  const hoy = new Date()
  for (let i = 0; i < n; i++) {
    const d = new Date(hoy)
    d.setDate(hoy.getDate() + i)
    dias.push(d)
  }
  return dias
}

function formatFecha(dateObj) {
  return dateObj.toISOString().split('T')[0]
}

function formatDuracion(minutos) {
  const horas = Math.trunc(minutos / 60)
  const resto = minutos % 60
  return `${horas > 0 ? `${horas} hs` : ''}${horas > 0 && resto > 0 ? ' ' : ''}${resto > 0 ? `${resto} min` : ''}`.trim()
}

export default function Home() {
  const [step, setStep] = useState(0)
  const [servicios, setServicios] = useState([])
  const [servicioSel, setServicioSel] = useState(null)
  const [fechaSel, setFechaSel] = useState(null)
  const [slots, setSlots] = useState([])
  const [slotSel, setSlotSel] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [form, setForm] = useState({ nombre_cliente: '', email: '', contacto: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const dias = getProximosDias(21)

  useEffect(() => {
    getServicios().then(setServicios).catch(console.error)
  }, [])

  useEffect(() => {
    if (!fechaSel) return
    setLoadingSlots(true)
    setSlotSel(null)
    getDisponibilidad(fechaSel)
      .then(setSlots)
      .catch(console.error)
      .finally(() => setLoadingSlots(false))
  }, [fechaSel])

  async function handleReservar() {
    setError('')
    setLoading(true)
    try {
      await reservarTurno({
        nombre_cliente: form.nombre_cliente,
        email: form.email,
        contacto: form.contacto,
        servicio_id: servicioSel.id,
        disponibilidad_id: slotSel.id,
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function resetReserva() {
    setStep(0)
    setSuccess(false)
    setServicioSel(null)
    setSlotSel(null)
    setFechaSel(null)
    setForm({ nombre_cliente: '', email: '', contacto: '' })
  }

  if (success) {
    return (
      <div className="booking-success">
        <div className="fade-in booking-success__content">
          <div className="booking-success__icon">✂️</div>
          <h2 className="booking-success__title">¡Turno confirmado!</h2>
          <p className="booking-success__text">
            Te enviamos un email de confirmación a <strong>{form.email}</strong>.
            Te esperamos el <strong>{fechaSel}</strong> a las <strong>{slotSel?.hora_inicio}</strong>.
          </p>
          <button className="btn btn-outline" onClick={resetReserva}>
            Reservar otro turno
          </button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <section className="hero-section">
        <p className="hero-section__eyebrow">Buenos Aires · Barbería</p>
        <h1 className="hero-section__title">StyloSpace</h1>
        <p className="hero-section__description">
          Reservá tu turno en minutos. Sin llamadas, sin esperas.
        </p>
        <button
          className="btn btn-primary"
          onClick={() => document.getElementById('reserva')?.scrollIntoView({ behavior: 'smooth' })}
        >
          Reservar turno
        </button>
      </section>

      <section id="reserva" className="booking-section">
        <div className="booking-steps">
          {STEPS.map((item, index) => (
            <div key={item} className="booking-steps__item">
              <div className={`booking-steps__dot ${index <= step ? 'is-completed' : ''}`}>
                {index + 1}
              </div>
              <span className={`booking-steps__label ${index === step ? 'is-active' : ''}`}>
                {item}
              </span>
            </div>
          ))}
        </div>

        {step === 0 && (
          <div className="fade-in">
            <h2 className="section-title">Elegí tu servicio</h2>
            <p className="section-subtitle">¿Qué te hacemos hoy?</p>

            <div className="services-grid">
              {servicios.map(servicio => {
                const selected = servicioSel?.id === servicio.id

                return (
                  <button
                    key={servicio.id}
                    onClick={() => {
                      setServicioSel(servicio)
                      setStep(1)
                    }}
                    className={`service-card ${selected ? 'is-selected' : ''}`}
                  >
                    <div className="service-card__media">
                      {servicio.imagen ? (
                        <img src={servicio.imagen} alt={servicio.nombre} className="service-card__image" />
                      ) : (
                        <div className="service-card__placeholder">Sin imagen</div>
                      )}
                    </div>

                    <div className="service-card__content">
                      <div className="service-card__title">{servicio.nombre}</div>
                      <div className="service-card__meta">
                        {formatDuracion(servicio.duracion_min)} · {servicio.descripcion}
                      </div>
                      <div className="service-card__price">${servicio.precio.toLocaleString('es-AR')}</div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="fade-in">
            <h2 className="section-title">Elegí el día</h2>
            <p className="section-subtitle">{servicioSel?.nombre} · {servicioSel?.duracion_min} min</p>

            <div className="day-selector">
              {dias.map(dia => {
                const valor = formatFecha(dia)
                const selected = fechaSel === valor

                return (
                  <button
                    key={valor}
                    onClick={() => setFechaSel(valor)}
                    className={`day-chip ${selected ? 'is-selected' : ''}`}
                  >
                    <span className="day-chip__weekday">{DIAS[dia.getDay()]}</span>
                    <span className="day-chip__day">{dia.getDate()}</span>
                  </button>
                )
              })}
            </div>

            {fechaSel && (
              <>
                <p className="label booking-slots__label">Horarios disponibles</p>
                {loadingSlots ? (
                  <div className="booking-loader"><div className="spinner" /></div>
                ) : slots.length === 0 ? (
                  <p className="empty-state empty-state--soft">No hay turnos disponibles para este día.</p>
                ) : (
                  <div className="slot-grid">
                    {slots.map(slot => (
                      <button
                        key={slot.id}
                        onClick={() => setSlotSel(slot)}
                        className={`slot-chip ${slotSel?.id === slot.id ? 'is-selected' : ''}`}
                      >
                        {slot.hora_inicio}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}

            <div className="action-row">
              <button className="btn btn-ghost" onClick={() => setStep(0)}>← Volver</button>
              <button className="btn btn-primary" disabled={!slotSel} onClick={() => setStep(2)}>
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="fade-in">
            <h2 className="section-title">Tus datos</h2>
            <p className="section-subtitle">Para confirmar tu turno necesitamos tus datos.</p>

            <div className="form-stack">
              <div className="form-group">
                <label className="label">Nombre completo</label>
                <input
                  className="input"
                  placeholder="Juan Pérez"
                  value={form.nombre_cliente}
                  onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  placeholder="juan@gmail.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                />
              </div>
              <div className="form-group">
                <label className="label">WhatsApp o Instagram</label>
                <input
                  className="input"
                  placeholder="1134567890 o @juanperez"
                  value={form.contacto}
                  onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
                />
              </div>
            </div>

            <div className="action-row action-row--spaced">
              <button className="btn btn-ghost" onClick={() => setStep(1)}>← Volver</button>
              <button
                className="btn btn-primary"
                disabled={!form.nombre_cliente || !form.email || !form.contacto}
                onClick={() => setStep(3)}
              >
                Continuar →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="fade-in">
            <h2 className="section-title">Confirmá tu turno</h2>
            <p className="section-subtitle">Revisá los detalles antes de confirmar.</p>

            <div className="card booking-summary-card">
              <Row label="Servicio" value={servicioSel?.nombre} />
              <hr className="divider" />
              <Row label="Fecha" value={fechaSel} />
              <Row label="Horario" value={slotSel?.hora_inicio} />
              <hr className="divider" />
              <Row label="Nombre" value={form.nombre_cliente} />
              <Row label="Email" value={form.email} />
              <Row label="Contacto" value={form.contacto} />
              <hr className="divider" />
              <Row label="Total" value={`$${servicioSel?.precio?.toLocaleString('es-AR')}`} big />
            </div>

            {error && <p className="error-msg booking-summary__error">{error}</p>}

            <div className="action-row">
              <button className="btn btn-ghost" onClick={() => setStep(2)}>← Volver</button>
              <button className="btn btn-primary" onClick={handleReservar} disabled={loading}>
                {loading ? <span className="spinner spinner-sm" /> : 'Confirmar turno'}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

function Row({ label, value, big }) {
  return (
    <div className="summary-row">
      <span className="summary-row__label">{label}</span>
      <span className={`summary-row__value ${big ? 'is-big' : ''}`}>{value}</span>
    </div>
  )
}
