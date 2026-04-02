import { useState } from 'react'
import { solicitarMembresia } from '../lib/api'

const DIAS = [
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
]

function generarHorarios(desde = '09:00', hasta = '18:00', paso = 30) {
  const horarios = []
  const [hD, mD] = desde.split(':').map(Number)
  const [hH, mH] = hasta.split(':').map(Number)
  let min = hD * 60 + mD
  const finMin = hH * 60 + mH
  while (min < finMin) {
    const h = String(Math.floor(min / 60)).padStart(2, '0')
    const m = String(min % 60).padStart(2, '0')
    horarios.push(`${h}:${m}`)
    min += paso
  }
  return horarios
}

const HORARIOS = generarHorarios()

export default function Membresia() {
  const [form, setForm] = useState({
    nombre_cliente: '',
    email: '',
    contacto: '',
    dia_semana: '',
    hora_inicio: '',
  })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await solicitarMembresia({
        ...form,
        dia_semana: Number(form.dia_semana),
      })
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div style={{ minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div className="fade-in" style={{ textAlign: 'center', maxWidth: 440 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>✉️</div>
          <h2 style={{ fontSize: 36, marginBottom: 12 }}>¡Solicitud enviada!</h2>
          <p style={{ color: 'var(--gray-600)' }}>
            Te enviamos un email de confirmación. Nos vamos a contactar a la brevedad para confirmar la disponibilidad.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <section style={{ padding: '80px 32px 64px', textAlign: 'center', borderBottom: '1px solid var(--gray-200)' }}>
        <p style={{ fontSize: 11, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'var(--gray-400)', marginBottom: 16 }}>
          StyloSpace · Membresía
        </p>
        <h1 style={{ fontSize: 'clamp(40px, 6vw, 64px)', marginBottom: 20 }}>
          Tu turno fijo,<br />cada semana
        </h1>
        <p style={{ color: 'var(--gray-600)', maxWidth: 440, margin: '0 auto' }}>
          Con la membresía reservás el mismo día y horario todas las semanas. Sin preocuparte por quedarte sin turno.
        </p>
      </section>

      <section style={{ maxWidth: 520, margin: '0 auto', padding: '64px 24px' }}>
        <h2 style={{ fontSize: 28, marginBottom: 8 }}>Solicitá tu membresía</h2>
        <p style={{ color: 'var(--gray-600)', marginBottom: 32, fontSize: 14 }}>
          Completá el formulario y nos contactamos para confirmar la disponibilidad del horario elegido.
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="label">Nombre completo</label>
            <input
              className="input"
              placeholder="Juan Pérez"
              value={form.nombre_cliente}
              onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))}
              required
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
              required
            />
          </div>

          <div className="form-group">
            <label className="label">WhatsApp o Instagram</label>
            <input
              className="input"
              placeholder="1134567890 o @juanperez"
              value={form.contacto}
              onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="label">Día preferido</label>
              <select
                className="input"
                value={form.dia_semana}
                onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))}
                required
              >
                <option value="">Elegir día</option>
                {DIAS.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="label">Horario preferido</label>
              <select
                className="input"
                value={form.hora_inicio}
                onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))}
                required
              >
                <option value="">Elegir hora</option>
                {HORARIOS.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {error && <p className="error-msg">{error}</p>}

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 8 }}>
            {loading ? <span className="spinner" style={{ width: 16, height: 16 }} /> : 'Enviar solicitud'}
          </button>
        </form>
      </section>
    </div>
  )
}
