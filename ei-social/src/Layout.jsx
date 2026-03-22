import { useNavigate, useLocation } from 'react-router-dom';

// 1. Mudamos os nomes nos parênteses para o que o App.jsx envia
function Layout({ children, usuario, onSair }) {
  const navigate = useNavigate();
  const location = useLocation(); // Para saber em qual página estamos

  // Função para saber se o botão deve brilhar (está ativo)
  const isAtivo = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* --- SEU DESIGN ORIGINAL DA BARRA --- */}
      <div style={{
        background: 'linear-gradient(90deg, #002776, #009c3b)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
      }}>
        <img
          onClick={() => navigate('/feed')} // Mudou aqui!
          src="/logo.png"
          alt="Ei"
          style={{ height: '40px', cursor: 'pointer' }}
        />

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/feed')} style={{
            background: isAtivo('/feed') ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', padding: '8px 16px',
            borderRadius: '20px', transition: 'all 0.2s'
          }}>🏠 Feed</button>

          <button onClick={() => navigate('/comunidades')} style={{
            background: isAtivo('/comunidades') ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', padding: '8px 16px',
            borderRadius: '20px', transition: 'all 0.2s'
          }}>👥 Comunidades</button>
        </div>

        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input placeholder="Buscar..." style={{
            padding: '8px 16px', borderRadius: '20px',
            border: 'none', width: '180px', fontSize: '14px', outline: 'none'
          }} />
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div onClick={() => navigate('/perfil')} style={{
                height: '36px', width: '36px', borderRadius: '50%',
                cursor: 'pointer', border: '2px solid white',
                background: 'white', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '20px'
            }}>👤</div>
            <button onClick={onSair} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: 'white', fontWeight: '700', fontSize: '13px',
                cursor: 'pointer', padding: '6px 14px', borderRadius: '20px'
            }}>Sair</button>
          </div>
        </div>
      </div>

      {/* --- A MÁGICA ACONTECE AQUI --- */}
      <main style={{ flex: 1, background: '#f0f2f5', color: '#333' }}>
        {/* Este 'children' é o que faz o Feed aparecer abaixo da barra! */}
        {children} 
      </main>
    </div>
  )
}

export default Layout;