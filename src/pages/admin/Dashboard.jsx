import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getTurnosAdmin, getSolicitudesMembresia } from '../../lib/api'

export default function Dashboard() {
  const [turnos, setTurnos] = useState([])
  const [solicitudes, setSolicitudes] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      getTurnosAdmin(),
      getSolicitudesMembresia('pendiente'),
    ]).then(([t, s]) => {
      setTurnos(t)
      setSolicitudes(s)
    }).finally(() => setLoading(false))
  }, [])

  const hoy = new Date().toISOString().split('T')[0]
  const turnosHoy = turnos.filter(t => t.fecha === hoy && t.estado === 'confirmed')
  const turnosManana = turnos.filter(t => {
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    return t.fecha === manana.toISOString().split('T')[0] && t.estado === 'confirmed'
  })

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 6 }}>Panel de administración</h1>
      <p style={{ color: 'var(--gray-600)', marginBottom: 40 }}>Bienvenido a StyloSpace</p>

     
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 48 }}>
        <StatCard label="Turnos hoy" value={turnosHoy.length} link="/admin/turnos" />
        <StatCard label="Turnos mañana" value={turnosManana.length} link="/admin/turnos" />
        <StatCard label="Solicitudes membresía" value={solicitudes.length} link="/admin/membresias" highlight={solicitudes.length > 0} />
      </div>

      
      <div style={{ marginBottom: 40 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 style={{ fontSize: 24 }}>Turnos de hoy</h2>
          <Link to="/admin/turnos" style={{ fontSize: 13, color: 'var(--gray-600)' }}>Ver todos →</Link>
        </div>
        {turnosHoy.length === 0 ? (
          <p style={{ color: 'var(--gray-400)', padding: '24px 0' }}>No hay turnos para hoy.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {turnosHoy.sort((a, b) => a.hora.localeCompare(b.hora)).map(t => (
              <div key={t.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{t.nombre_cliente}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{t.servicio_nombre}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{t.hora}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>${t.precio?.toLocaleString('es-AR')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {solicitudes.length > 0 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h2 style={{ fontSize: 24 }}>Solicitudes de membresía pendientes</h2>
            <Link to="/admin/membresias" style={{ fontSize: 13, color: 'var(--gray-600)' }}>Ver todas →</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {solicitudes.map(s => (
              <div key={s.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px' }}>
                <div>
                  <div style={{ fontWeight: 500 }}>{s.nombre_cliente}</div>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{s.dia_nombre} a las {s.hora_inicio} · {s.contacto}</div>
                </div>
                <span className="badge badge-pendiente">Pendiente</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, link, highlight }) {
  return (
    <Link to={link} style={{ textDecoration: 'none' }}>
      <div className="card" style={{
        borderColor: highlight ? 'var(--black)' : 'var(--gray-200)',
        transition: 'border-color var(--transition)',
        cursor: 'pointer',
      }}>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: 40, fontWeight: 300, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: 'var(--gray-600)', marginTop: 8 }}>{label}</div>
      </div>
    </Link>
  )
}
