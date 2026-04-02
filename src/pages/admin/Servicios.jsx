import { useState, useEffect } from 'react'
import { getServiciosAdmin, crearServicio, editarServicio, eliminarServicio } from '../../lib/api'

const EMPTY = { nombre: '', precio: '', duracion_min: '', descripcion: '', activo: true }

export default function Servicios() {
  const [servicios, setServicios] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    getServiciosAdmin().then(setServicios).finally(() => setLoading(false))
  }, [])

  function startEdit(s) {
    setEditId(s.id)
    setForm({ nombre: s.nombre, precio: s.precio, duracion_min: s.duracion_min, descripcion: s.descripcion, activo: s.activo })
  }

  function cancelEdit() {
    setEditId(null)
    setForm(EMPTY)
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    try {
      const data = { ...form, precio: Number(form.precio), duracion_min: Number(form.duracion_min) }
      if (editId) {
        await editarServicio(editId, data)
        setServicios(ss => ss.map(s => s.id === editId ? { ...s, ...data } : s))
      } else {
        const res = await crearServicio(data)
        setServicios(ss => [...ss, { id: res.id, ...data }])
      }
      cancelEdit()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleEliminar(id) {
    if (!confirm('¿Desactivar este servicio?')) return
    await eliminarServicio(id)
    setServicios(ss => ss.map(s => s.id === id ? { ...s, activo: false } : s))
  }

  if (loading) return <div className="page-loader"><div className="spinner" /></div>

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px' }}>
      <h1 style={{ fontSize: 36, marginBottom: 40 }}>Servicios</h1>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40, alignItems: 'start' }}>
        <div>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>Servicios actuales</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {servicios.map(s => (
              <div key={s.id} className="card" style={{ opacity: s.activo ? 1 : 0.45 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 500 }}>{s.nombre}</div>
                    <div style={{ fontSize: 13, color: 'var(--gray-600)' }}>{s.duracion_min} min · {s.descripcion}</div>
                    {!s.activo && <span style={{ fontSize: 11, color: 'var(--gray-400)' }}>Inactivo</span>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>${s.precio?.toLocaleString('es-AR')}</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                  <button className="btn btn-outline" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => startEdit(s)}>
                    Editar
                  </button>
                  {s.activo && (
                    <button className="btn btn-danger" style={{ padding: '6px 14px', fontSize: 12 }} onClick={() => handleEliminar(s.id)}>
                      Desactivar
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h2 style={{ fontSize: 20, marginBottom: 16 }}>{editId ? 'Editar servicio' : 'Nuevo servicio'}</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="form-group">
              <label className="label">Nombre</label>
              <input className="input" placeholder="Corte" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} required />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div className="form-group">
                <label className="label">Precio ($)</label>
                <input className="input" type="number" placeholder="2500" value={form.precio} onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} required />
              </div>
              <div className="form-group">
                <label className="label">Duración (min)</label>
                <input className="input" type="number" placeholder="30" value={form.duracion_min} onChange={e => setForm(f => ({ ...f, duracion_min: e.target.value }))} required />
              </div>
            </div>
            <div className="form-group">
              <label className="label">Descripción</label>
              <input className="input" placeholder="Corte de cabello clásico" value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
            </div>
            {error && <p className="error-msg">{error}</p>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <span className="spinner" style={{ width: 14, height: 14 }} /> : editId ? 'Guardar cambios' : 'Crear servicio'}
              </button>
              {editId && <button type="button" className="btn btn-ghost" onClick={cancelEdit}>Cancelar</button>}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
