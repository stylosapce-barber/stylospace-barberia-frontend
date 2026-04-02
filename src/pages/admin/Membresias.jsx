import { useState, useEffect } from 'react'
import {
  getMembresias, crearMembresia, bajaMembresia, liberarFechaMembresia,
  getSolicitudesMembresia, actualizarSolicitud, getServiciosAdmin,
} from '../../lib/api'

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function generarHorarios() {
  const horarios = []
  for (let h = 8; h < 21; h++) {
    horarios.push(`${String(h).padStart(2, '0')}:00`)
    horarios.push(`${String(h).padStart(2, '0')}:30`)
  }
  return horarios
}
const HORARIOS = generarHorarios()

const EMPTY = {
  nombre_cliente: '', email: '', contacto: '',
  servicio_id: '', dia_semana: '', hora_inicio: '',
}

export default function Membresias() {
  const [tab, setTab] = useState('activas')
  const [membresias, setMembresias] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [liberandoId, setLiberandoId] = useState(null)
  const [fechaLiberar, setFechaLiberar] = useState({})

  useEffect(() => {
    Promise.all([
      getMembresias(),
      getSolicitudesMembresia(),
      getServiciosAdmin(),
    ]).then(([m, s, sv]) => {
      setMembresias(m)
      setSolicitudes(s)
      setServicios(sv)
    }).finally(() => setLoading(false))
  }, [])

  async function handleCrear(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      // Calcular hora_fin automáticamente (+30 min)
      const [h, m] = form.hora_inicio.split(':').map(Number)
      const finMin = h * 60 + m + 30
      const hora_fin = `${String(Math.floor(finMin / 60)).padStart(2, '0')}:${String(finMin % 60).padStart(2, '0')}`

      const res = await crearMembresia({
        ...form,
        dia_semana: Number(form.dia_semana),
        hora_fin,
      })
      setMsg(`✓ Membresía creada. ${res.turnos_reservados} turnos reservados.`)
      const updated = await getMembresias()
      setMembresias(updated)
      setForm(EMPTY)
    } catch (err) {
      setMsg('Error: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleBaja(id, nombre) {
    if (!confirm(`¿Dar de baja la membresía de ${nombre}? Se cancelarán todos sus turnos futuros.`)) return
    await bajaMembresia(id)
    setMembresias(ms => ms.map(m => m.id === id ? { ...m, activo: false } : m))
  }

  async function handleLiberarFecha(id) {
    const fecha = fechaLiberar[id]
    if (!fecha) return
    setLiberandoId(id)
    try {
      await liberarFechaMembresia(id, fecha)
      setFechaLiberar(f => ({ ...f, [id]: '' }))
      alert(`Fecha ${fecha} liberada correctamente`)
    } catch (err) {
      alert('Error: ' + err.message)
    } finally {
      setLiberandoId(null)
    }
  }

  async function handleSolicitud(id, estado) {
    await actualizarSolicitud(id, estado)
    setSolicitudes(ss => ss.map(s => s.id === id ? { ...s, estado } : s))
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  const activas = membresias.filter(m => m.activo)
  const inactivas = membresias.filter(m => !m.activo)
  const pendientes = solicitudes.filter(s => s.estado === 'pendiente')

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 40 }}>Membresías</h1>

      <div style={{ display: 'flex', gap: 0, borderBottom: '1px solid var(--gray-200)', marginBottom: 32 }}>
        {[
          { key: 'activas', label: `Activas (${activas.length})` },
          { key: 'solicitudes', label: `Solicitudes (${pendientes.length})` },
          { key: 'nueva', label: 'Nueva membresía' },
          { key: 'inactivas', label: `Inactivas (${inactivas.length})` },
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

      {tab === 'activas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {activas.length === 0 && <p style={{ color: 'var(--gray-400)', padding: '24px 0' }}>No hay membresías activas.</p>}
          {activas.map(m => (
            <div key={m.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 16 }}>{m.nombre_cliente}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                    {m.servicio_nombre} · todos los {DIAS[m.dia_semana]} a las {m.hora_inicio}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{m.email} · {m.contacto}</div>
                </div>
                <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => handleBaja(m.id, m.nombre_cliente)}>
                  Dar de baja
                </button>
              </div>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 12, borderTop: '1px solid var(--gray-100)' }}>
                <span style={{ fontSize: 12, color: 'var(--gray-600)' }}>Liberar fecha puntual:</span>
                <input
                  type="date"
                  className="input"
                  style={{ width: 'auto', padding: '6px 10px', fontSize: 13 }}
                  value={fechaLiberar[m.id] || ''}
                  onChange={e => setFechaLiberar(f => ({ ...f, [m.id]: e.target.value }))}
                />
                <button
                  className="btn btn-outline"
                  style={{ padding: '6px 14px', fontSize: 12 }}
                  disabled={!fechaLiberar[m.id] || liberandoId === m.id}
                  onClick={() => handleLiberarFecha(m.id)}
                >
                  {liberandoId === m.id ? <span className="spinner" style={{ width: 12, height: 12 }} /> : 'Liberar'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'solicitudes' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {solicitudes.length === 0 && <p style={{ color: 'var(--gray-400)', padding: '24px 0' }}>No hay solicitudes.</p>}
          {solicitudes.map(s => (
            <div key={s.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.nombre_cliente}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                    Todos los {s.dia_nombre} a las {s.hora_inicio}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{s.email} · {s.contacto}</div>
                </div>
                <span className={`badge badge-${s.estado}`}>{s.estado}</span>
              </div>
              {s.estado === 'pendiente' && (
                <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                  <button className="btn btn-primary" style={{ padding: '8px 18px', fontSize: 12 }} onClick={() => handleSolicitud(s.id, 'aprobada')}>
                    Aprobar
                  </button>
                  <button className="btn btn-danger" style={{ padding: '8px 18px', fontSize: 12 }} onClick={() => handleSolicitud(s.id, 'rechazada')}>
                    Rechazar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {tab === 'nueva' && (
        <form onSubmit={handleCrear} style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div className="form-group">
            <label className="label">Nombre completo</label>
            <input className="input" placeholder="Lucas Pérez" value={form.nombre_cliente} onChange={e => setForm(f => ({ ...f, nombre_cliente: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Email</label>
            <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">WhatsApp o Instagram</label>
            <input className="input" value={form.contacto} onChange={e => setForm(f => ({ ...f, contacto: e.target.value }))} required />
          </div>
          <div className="form-group">
            <label className="label">Servicio</label>
            <select className="input" value={form.servicio_id} onChange={e => setForm(f => ({ ...f, servicio_id: e.target.value }))} required>
              <option value="">Elegir servicio</option>
              {servicios.filter(s => s.activo).map(s => (
                <option key={s.id} value={s.id}>{s.nombre} — ${s.precio?.toLocaleString('es-AR')}</option>
              ))}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="form-group">
              <label className="label">Día fijo</label>
              <select className="input" value={form.dia_semana} onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))} required>
                <option value="">Elegir día</option>
                {DIAS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="label">Horario fijo</label>
              <select className="input" value={form.hora_inicio} onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} required>
                <option value="">Elegir hora</option>
                {HORARIOS.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--gray-400)', marginTop: -8 }}>
            El turno dura 30 minutos. La hora de fin se calcula automáticamente.
          </p>

          {msg && <p style={{ fontSize: 13, color: msg.startsWith('✓') ? '#2e7d32' : '#c0392b' }}>{msg}</p>}

          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Activar membresía'}
          </button>
        </form>
      )}

      {tab === 'inactivas' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {inactivas.length === 0 && <p style={{ color: 'var(--gray-400)', padding: '24px 0' }}>No hay membresías inactivas.</p>}
          {inactivas.map(m => (
            <div key={m.id} className="card" style={{ opacity: 0.5 }}>
              <div style={{ fontWeight: 500 }}>{m.nombre_cliente}</div>
              <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                {m.servicio_nombre} · {DIAS[m.dia_semana]} {m.hora_inicio}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
