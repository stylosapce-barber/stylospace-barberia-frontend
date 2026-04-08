import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'
import logo from '../assets/logo.jpg'

export default function Navbar({ user }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const isAdmin = location.pathname.startsWith('/admin')

  async function handleLogout() {
    await signOut(auth)
    setMenuOpen(false)
    navigate('/')
  }

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <nav className="site-nav">
      <div className="site-nav__inner">
        <Link to={user ? '/admin' : '/'} className="site-nav__brand" onClick={closeMenu}>
          <img src={logo} alt="StyloSpace" className="site-nav__logo" />
          <span className="site-nav__title">StyloSpace</span>
        </Link>

        <button
          type="button"
          className="site-nav__toggle"
          aria-label={menuOpen ? 'Cerrar menú' : 'Abrir menú'}
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(open => !open)}
        >
          <span />
          <span />
          <span />
        </button>

        <div className={`site-nav__content ${menuOpen ? 'is-open' : ''}`}>
          <div className="site-nav__links">
            {!isAdmin && (
              <Link to="/" className="btn btn-ghost site-nav__action-link" onClick={closeMenu}>
                Reservar turno
              </Link>
            )}

            {isAdmin && (
              <>
                <NavLink to="/admin" onClick={closeMenu}>Inicio</NavLink>
                <NavLink to="/admin/turnos" onClick={closeMenu}>Turnos</NavLink>
                <NavLink to="/admin/servicios" onClick={closeMenu}>Servicios</NavLink>
                <NavLink to="/admin/disponibilidad" onClick={closeMenu}>Disponibilidad</NavLink>
              </>
            )}
          </div>

          <div className="site-nav__auth">
            {user ? (
              <button onClick={handleLogout} className="btn btn-outline site-nav__auth-button">
                Salir
              </button>
            ) : (
              <Link to="/login" className="btn btn-outline site-nav__auth-button" onClick={closeMenu}>
                Admin
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}

function NavLink({ to, children, onClick }) {
  const location = useLocation()
  const active = location.pathname === to

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`site-nav__link ${active ? 'is-active' : ''}`}
    >
      {children}
    </Link>
  )
}
