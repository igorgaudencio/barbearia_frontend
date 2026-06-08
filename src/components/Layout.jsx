import { NavLink, Outlet, useNavigate } from 'react-router-dom'

const linkStyle = (active) => ({
  padding: '8px 18px', fontSize: 15, fontWeight: 600, borderRadius: 8, textDecoration: 'none',
  border: '1px solid ' + (active ? 'var(--border-strong)' : 'transparent'),
  background: active ? 'var(--bg-card)' : 'none',
  color: active ? 'var(--gold)' : 'var(--text-secondary)'
})

export default function Layout({ theme, toggleTheme }) {
  const navigate = useNavigate()
  const token = localStorage.getItem('token')

  function logout() {
    localStorage.removeItem('token')
    localStorage.removeItem('email')
    navigate('/barbeiro')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <header style={{ background: 'var(--bg-hero)', borderBottom: '1px solid var(--border-strong)', padding: '0 2rem', minHeight: 72, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ color: 'var(--gold)', fontSize: 22 }}>✂</span>
          <div>
            <div style={{ fontFamily: 'serif', fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Barbearia Coquilho</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Est. 2026</div>
          </div>
        </div>

        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Ativar modo ${theme === 'dark' ? 'claro' : 'escuro'}`}
            title={theme === 'dark' ? 'Ativar modo claro' : 'Ativar modo escuro'}
            style={{ width: 42, height: 42, display: 'grid', placeItems: 'center', fontSize: 20, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-surface)', color: 'var(--text-primary)', cursor: 'pointer' }}
          >
            <span aria-hidden="true">{theme === 'dark' ? '☀' : '☾'}</span>
          </button>
          <NavLink to="/" end style={({ isActive }) => linkStyle(isActive)}>
            Agendamento
          </NavLink>

          {token ? (
            <>
              <NavLink to="/painel" style={({ isActive }) => linkStyle(isActive)}>
                Painel
              </NavLink>
              <button onClick={logout} style={{ padding: '8px 18px', fontSize: 15, fontWeight: 600, borderRadius: 8, border: '1px solid var(--danger-border)', background: 'none', color: 'var(--danger)', cursor: 'pointer' }}>
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

      <footer style={{ background: 'var(--bg-hero)', borderTop: '1px solid var(--border-soft)', textAlign: 'center', padding: '1.25rem', fontSize: 14, fontWeight: 500, color: 'var(--text-muted)' }}>
        <span style={{ color: 'var(--gold)' }}>Barbearia Coquilho</span> · Rua dos Caminhões, 67 · (84) 98747-9792
      </footer>
    </div>
  )
}
