import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const linkStyle = (active) => ({
  padding: '6px 16px', fontSize: 13, borderRadius: 8, textDecoration: 'none',
  border: '1px solid ' + (active ? '#2e2518' : 'transparent'),
  background: active ? '#1a1508' : 'none',
  color: active ? '#D4A853' : '#888'
})

export default function Layout() {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    navigate('/barbeiro')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ background: '#0a0a0a', borderBottom: '1px solid #222', padding: '0 2rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: '#D4A853', fontSize: 22 }}>✂</span>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: 18, color: '#f0ede6' }}>Barbearia Elite</div>
            <div style={{ fontSize: 10, color: '#555', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Est. 2018</div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <NavLink to="/" end style={({ isActive }) => linkStyle(isActive)}>
            Agendamento
          </NavLink>

          {token ? (
            <>
              <NavLink to="/painel" style={({ isActive }) => linkStyle(isActive)}>
                Painel
              </NavLink>
              <button onClick={logout} style={{ padding: '6px 16px', fontSize: 13, borderRadius: 8, border: '1px solid #3a1f1f', background: 'none', color: '#8b4a4a', cursor: 'pointer', fontFamily: 'inherit' }}>
                Sair
              </button>
            </>
          ) : (
            <NavLink to="/barbeiro" style={({ isActive }) => linkStyle(isActive)}>
              Área do Barbeiro
            </NavLink>
          )}
        </nav>
      </header>

      <main style={{ flex: 1 }}>
        <Outlet />
      </main>

      <footer style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a', textAlign: 'center', padding: '1.25rem', fontSize: 12, color: '#555' }}>
        <span style={{ color: '#D4A853' }}>Barbearia Elite</span> · Rua das Flores, 123 · (84) 99999-0000
      </footer>
    </div>
  )
}