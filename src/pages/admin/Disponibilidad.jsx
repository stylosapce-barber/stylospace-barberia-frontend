import { useState, useEffect } from 'react'
import { getDisponibilidadAdmin, crearRango, crearSlot, toggleSlot } from '../../lib/api'

const DIAS_SEMANA = [
  { label: 'Domingo', value: 0 },
  { label: 'Lunes', value: 1 },
  { label: 'Martes', value: 2 },
  { label: 'Miércoles', value: 3 },
  { label: 'Jueves', value: 4 },
  { label: 'Viernes', value: 5 },
  { label: 'Sábado', value: 6 },
]

const EMPTY_RANGO = {
  dias_semana: [],
  hora_desde: '09:00',
  hora_hasta: '18:00',
  fecha_desde: '',
  fecha_hasta: '',
  duracion_min: 30,
}

const EMPTY_SLOT = { fecha: '', hora_inicio: '', hora_fin: '' }

export default function Disponibilidad() {
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [slots, setSlots] = useState([])
  const [loading, setLoading] = useState(false)
  const [tab, setTab] = useState('slots') // 'slots' | 'rango' | 'manual'
  const [rango, setRango] = useState(EMPTY_RANGO)
  const [slot, setSlot] = useState(EMPTY_SLOT)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    setLoading(true)
    getDisponibilidadAdmin(fecha)
      .then(setSlots)
      .finally(() => setLoading(false))
  }, [fecha])

  async function handleToggle(s) {
    await toggleSlot(s.id, !s.disponible)
    setSlots(ss => ss.map(x => x.id === s.id ? { ...x, disponible: !x.disponible } : x))
  }

  async function handleCrearRango(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      const res = await crearRango({ ...rango, duracion_min: Number(rango.duracion_min) })
      setMsg(`✓ Rango creado: ${res.slots_creados} slots generados`)
      setRango(EMPTY_RANGO)
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleCrearSlot(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      await crearSlot(slot)
      setMsg('✓ Slot creado correctamente')
      setSlot(EMPTY_SLOT)
      if (slot.fecha === fecha) {
        const updated = await getDisponibilidadAdmin(fecha)
        setSlots(updated)
      }
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  function toggleDia(val) {
    setRango(r => ({
      ...r,
      dias_semana: r.dias_semana.includes(val)
        ? r.dias_semana.filter(d => d !== val)
        : [...r.dias_semana, val],
    }))
  }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 40 }}>Disponibilidad</h1>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', marginBottom: 32 }}>
        {[
          { key: 'slots', label: 'Ver slots' },
          { key: 'rango', label: 'Crear rango' },
          { key: 'manual', label: 'Slot manual' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => { setTab(t.key); setMsg('') }}
            style={{
              padding: '12px 20px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t.key ? '2px solid var(--black)' : '2px solid transparent',
              color: tab === t.key ? 'var(--black)' : 'var(--gray-600)',
              fontWeight: tab === t.key ? 500 : 400,
              fontSize: 14,
              cursor: 'pointer',
              marginBottom: '-1px',
              transition: 'all var(--transition)',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'slots' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
            <div className="form-group">
              <label className="label">Fecha</label>
              <input type="date" className="input" style={{ width: 'auto' }} value={fecha} onChange={e => setFecha(e.target.value)} />
            </div>
          </div>

          {loading ? (
            <div className="page-loader"><div className="spinner" /></div>
          ) : slots.length === 0 ? (
            <p style={{ color: 'var(--gray-400)', textAlign: 'center', padding: 32 }}>No hay slots para esta fecha.</p>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 10 }}>
              {slots.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleToggle(s)}
                  style={{
                    padding: '14px 10px',
                    border: '1px solid',
                    borderColor: s.disponible ? 'var(--gray-200)' : 'var(--black)',
                    borderRadius: 'var(--radius-md)',
                    background: s.disponible ? 'var(--white)' : 'var(--black)',
                    color: s.disponible ? 'var(--black)' : 'var(--white)',
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 16, fontWeight: 500 }}>{s.hora_inicio}</div>
                  <div style={{ fontSize: 11, marginTop: 4, opacity: 0.7 }}>
                    {s.disponible ? 'Disponible' : 'Ocupado'}
                  </div>
                </button>
              ))}
            </div>
          )}
          <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: 16 }}>
            Hacé click en un slot para habilitarlo o deshabilitarlo.
          </p>
        </div>
      )}

      {tab === 'rango' && (
        <form onSubmit={handleCrearRango} style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="label">Días de la semana</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {DIAS_SEMANA.map(d => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => toggleDia(d.value)}
                  style={{
                    padding: '8px 14px',
                    border: '1px solid',
                    borderColor: rango.dias_semana.includes(d.value) ? 'var(--black)' : 'var(--gray-200)',
                    borderRadius: 'var(--radius)',
                    background: rango.dias_semana.includes(d.value) ? 'var(--black)' : 'var(--white)',
                    color: rango.dias_semana.includes(d.value) ? 'var(--white)' : 'var(--black)',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all var(--transition)',
                  }}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="label">Hora desde</label>
              <input type="time" className="input" value={rango.hora_desde} onChange={e => setRango(r => ({ ...r, hora_desde: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Hora hasta</label>
              <input type="time" className="input" value={rango.hora_hasta} onChange={e => setRango(r => ({ ...r, hora_hasta: e.target.value }))} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="label">Fecha desde</label>
              <input type="date" className="input" value={rango.fecha_desde} onChange={e => setRango(r => ({ ...r, fecha_desde: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Fecha hasta</label>
              <input type="date" className="input" value={rango.fecha_hasta} onChange={e => setRango(r => ({ ...r, fecha_hasta: e.target.value }))} required />
            </div>
          </div>

          <div className="form-group">
            <label className="label">Duración por slot (minutos)</label>
            <input type="number" className="input" value={rango.duracion_min} onChange={e => setRango(r => ({ ...r, duracion_min: e.target.value }))} min={15} max={180} step={15} required />
          </div>

          {msg && <p style={{ fontSize: 13, color: msg.startsWith('✓') ? '#2e7d32' : '#c0392b' }}>{msg}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving || rango.dias_semana.length === 0}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Generar slots'}
          </button>
        </form>
      )}

      {tab === 'manual' && (
        <form onSubmit={handleCrearSlot} style={{ maxWidth: 400, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="label">Fecha</label>
            <input type="date" className="input" value={slot.fecha} onChange={e => setSlot(s => ({ ...s, fecha: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label className="label">Hora inicio</label>
              <input type="time" className="input" value={slot.hora_inicio} onChange={e => setSlot(s => ({ ...s, hora_inicio: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="label">Hora fin</label>
              <input type="time" className="input" value={slot.hora_fin} onChange={e => setSlot(s => ({ ...s, hora_fin: e.target.value }))} required />
            </div>
          </div>

          {msg && <p style={{ fontSize: 13, color: msg.startsWith('✓') ? '#2e7d32' : '#c0392b' }}>{msg}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Crear slot'}
          </button>
        </form>
      )}
    </div>
  )
}
