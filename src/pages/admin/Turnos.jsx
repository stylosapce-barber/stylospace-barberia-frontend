import { useState, useEffect } from 'react'
import { getTurnosAdmin, cancelarTurno } from '../../lib/api'

export default function Turnos() {
  const [turnos, setTurnos] = useState([])
  const [loading, setLoading] = useState(true)
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])
  const [cancelando, setCancelando] = useState(null)

  useEffect(() => {
    setLoading(true)
    getTurnosAdmin({ fecha })
      .then(setTurnos)
      .finally(() => setLoading(false))
  }, [fecha])

  async function handleCancelar(id) {
    if (!confirm('¿Cancelar este turno? Se va a notificar al cliente.')) return
    setCancelando(id)
    try {
      await cancelarTurno(id)
      setTurnos(ts => ts.map(t => t.id === id ? { ...t, estado: 'cancelled' } : t))
    } catch (err) {
      alert('Error al cancelar: ' + err.message)
    } finally {
      setCancelando(null)
    }
  }

  const confirmados = turnos.filter(t => t.estado === 'confirmed')
  const cancelados = turnos.filter(t => t.estado === 'cancelled')

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 32 }}>
        <div>
          <h1 style={{ fontSize: 36, marginBottom: 6 }}>Turnos</h1>
          <p style={{ color: 'var(--gray-600)' }}>{confirmados.length} confirmados · {cancelados.length} cancelados</p>
        </div>
        <div className="form-group">
          <label className="label">Fecha</label>
          <input
            type="date"
            className="input"
            style={{ width: 'auto' }}
            value={fecha}
            onChange={e => setFecha(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="page-loader"><div className="spinner" /></div>
      ) : turnos.length === 0 ? (
        <p style={{ color: 'var(--gray-400)', padding: '32px 0', textAlign: 'center' }}>
          No hay turnos para esta fecha.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {turnos.sort((a, b) => a.hora.localeCompare(b.hora)).map(t => (
            <div key={t.id} className="card" style={{
              display: 'grid',
              gridTemplateColumns: '80px 1fr auto auto',
              alignItems: 'center',
              gap: 20,
              padding: '16px 20px',
              opacity: t.estado === 'cancelled' ? 0.5 : 1,
            }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 300 }}>{t.hora}</div>
              <div>
                <div style={{ fontWeight: 500 }}>{t.nombre_cliente}</div>
                <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>
                  {t.servicio_nombre} · {t.contacto}
                </div>
                <div style={{ fontSize: 13, color: 'var(--gray-400)' }}>{t.email}</div>
                {t.membresia_id && (
                  <span style={{ fontSize: 11, background: 'var(--gray-100)', padding: '2px 8px', borderRadius: 20, marginTop: 4, display: 'inline-block' }}>
                    Membresía
                  </span>
                )}
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 500 }}>${t.precio?.toLocaleString('es-AR')}</div>
                <span className={`badge badge-${t.estado}`}>{t.estado}</span>
              </div>
              {t.estado === 'confirmed' && (
                <button
                  className="btn btn-danger"
                  style={{ whiteSpace: 'nowrap', padding: '8px 14px', fontSize: 12 }}
                  disabled={cancelando === t.id}
                  onClick={() => handleCancelar(t.id)}
                >
                  {cancelando === t.id ? <span className="spinner" style={{ width: 14, height: 14 }} /> : 'Cancelar'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
