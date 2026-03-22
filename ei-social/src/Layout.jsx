import { useNavigate, useLocation } from 'react-router-dom';

function Layout({ children, usuario, onSair }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Função para saber se o botão deve brilhar (está ativo)
  const isAtivo = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- BARRA DE NAVEGAÇÃO --- */}
      <div style={{
        background: 'linear-gradient(90deg, #002776, #009c3b)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
        height: '60px', // Altura fixa da barra para evitar pulos no conteúdo
        boxSizing: 'border-box'
      }}>
        
        {/* LOGO: Com dimensões travadas para evitar o "pisca-pisca" */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '40px' }}>
          <img
            onClick={() => navigate('/feed')}
            src="/logo.png"
            alt="Ei"
            style={{ 
              height: '40px', 
              width: '40px', // Travamos a largura também
              minWidth: '40px', // Reforço para o navegador
              cursor: 'pointer',
              objectFit: 'contain',
              display: 'block' // Remove espaços fantasmas abaixo da imagem
            }}
          />
        </div>

        {/* BOTÕES CENTRAIS */}
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

        {/* BUSCA E PERFIL */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            placeholder="Buscar..." 
            style={{
              padding: '8px 16px', borderRadius: '20px',
              border: 'none', width: '180px', fontSize: '14px', outline: 'none'
            }} 
          />
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Ícone de Perfil */}
            <div 
              onClick={() => navigate('/perfil')} 
              style={{
                height: '36px', width: '36px', borderRadius: '50%',
                cursor: 'pointer', border: '2px solid white',
                background: 'white', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                fontSize: '20px',
                overflow: 'hidden'
              }}
            >
              {usuario?.photoURL ? (
                <img src={usuario.photoURL} style={{width: '100%', height: '100%', objectFit: 'cover'}} />
              ) : "👤"}
            </div>

            <button onClick={onSair} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: 'white', fontWeight: '700', fontSize: '13px',
                cursor: 'pointer', padding: '6px 14px', borderRadius: '20px'
            }}>Sair</button>
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main style={{ 
        flex: 1, 
        background: '#f0f2f5', 
        color: '#333',
        paddingTop: '20px' // Espaçamento para o conteúdo não grudar na barra
      }}>
        {children} 
      </main>
    </div>
  )
}

export default Layout;