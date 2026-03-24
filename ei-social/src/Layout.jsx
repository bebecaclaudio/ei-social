import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from './firebase-config' 
import { doc, onSnapshot } from 'firebase/firestore'

function Layout({ children, usuario, onSair }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fotoExibir, setFotoExibir] = useState('')

  // 1. Sincronia da foto de perfil (Base64 do banco ou Google)
  useEffect(() => {
    if (!usuario?.uid) return
    const unsub = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        setFotoExibir(docSnap.data().foto || usuario?.photoURL || '')
      } else {
        setFotoExibir(usuario?.photoURL || '')
      }
    })
    return () => unsub()
  }, [usuario])

  // Identifica qual página está aberta para iluminar o botão
  const isAtivo = (path) => location.pathname === path;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- NAVBAR FIXA (NÃO MUDA NUNCA) --- */}
      <div style={navStyle}>
        
        {/* Lado Esquerdo: Logo */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img
            onClick={() => navigate('/feed')}
            src="/logo.png"
            alt="Ei"
            style={{ height: '40px', width: '40px', cursor: 'pointer', objectFit: 'contain' }}
          />
        </div>

        {/* Centro: Menu de Navegação */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/feed')} style={btnNavStyle(isAtivo('/feed'))}>🏠 Feed</button>
          <button onClick={() => navigate('/comunidades')} style={btnNavStyle(isAtivo('/comunidades'))}>👥 Comunidades</button>
        </div>

        {/* Lado Direito: Busca + Perfil + Sair */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          <input 
            placeholder="Buscar..." 
            style={inputStyle} 
          />
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Foto de Perfil */}
            <div 
              onClick={() => navigate('/perfil')} 
              style={avatarStyle}
            >
              {(fotoExibir || usuario?.photoURL) ? (
                <img 
                  src={fotoExibir || usuario?.photoURL} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                  alt=""
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: '18px' }}>👤</span>
              )}
            </div>

            <button onClick={onSair} style={btnSairStyle}>Sair</button>
          </div>
        </div>
      </div>

      {/* --- CONTEÚDO DA PÁGINA --- */}
      <main style={{ flex: 1, background: '#f0f2f5', paddingTop: '20px' }}>
        {children} 
      </main>
    </div>
  )
}

// --- ESTILOS ---
const navStyle = {
  background: 'linear-gradient(90deg, #002776, #009c3b)',
  padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  position: 'sticky', top: 0, zIndex: 100, height: '60px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
};

const btnNavStyle = (ativo) => ({
  background: ativo ? 'rgba(255,255,255,0.2)' : 'transparent',
  border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', padding: '8px 16px', borderRadius: '20px'
});

const inputStyle = {
  padding: '8px 16px', borderRadius: '20px', border: 'none', width: '180px', fontSize: '14px', outline: 'none'
};

const avatarStyle = {
  height: '36px', width: '36px', borderRadius: '50%', cursor: 'pointer', border: '2px solid white',
  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
};

const btnSairStyle = {
  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px'
};

export default Layout;