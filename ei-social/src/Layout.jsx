import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from './firebase-config' 
import { doc, onSnapshot } from 'firebase/firestore'

function Layout({ children, usuario, onSair }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fotoExibir, setFotoExibir] = useState('')

  // 1. Sincronia da foto com o Firestore
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

  const isAtivo = (path) => location.pathname === path;

  // 2. Lógica de Ações Dinâmicas (Botões que mudam, mas a busca fica!)
  const renderAcoesExtras = () => {
    if (location.pathname === '/comunidades') {
      return <button style={btnExtraStyle}>+ Nova Comunidade</button>;
    }
    if (location.pathname === '/perfil') {
      return <button style={btnExtraStyle}>⚙️ Editar</button>;
    }
    return null; // No Feed não precisa de botão extra por enquanto
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- NAVBAR --- */}
      <div style={navContainerStyle}>
        
        {/* LOGO */}
        <img
          onClick={() => navigate('/feed')}
          src="/logo.png"
          alt="Ei"
          style={{ height: '40px', width: '40px', cursor: 'pointer' }}
        />

        {/* MENU CENTRAL */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => navigate('/feed')} style={btnNavStyle(isAtivo('/feed'))}>🏠 Feed</button>
          <button onClick={() => navigate('/comunidades')} style={btnNavStyle(isAtivo('/comunidades'))}>👥 Comunidades</button>
        </div>

        {/* BUSCA (AGORA FIXA) E PERFIL */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          
          {/* A Busca agora não some mais! */}
          <input 
            placeholder="Buscar..." 
            style={inputBuscaStyle} 
          />
          
          {/* Espaço para o botão que muda conforme a página */}
          {renderAcoesExtras()}

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <div onClick={() => navigate('/perfil')} style={avatarContainerStyle}>
              {(fotoExibir || usuario?.photoURL) ? (
                <img 
                  src={fotoExibir || usuario?.photoURL} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}} 
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

      {/* --- CONTEÚDO --- */}
      <main style={{ flex: 1, background: '#f0f2f5', paddingTop: '20px' }}>
        {children} 
      </main>
    </div>
  )
}

// --- ESTILOS OBJETOS (Para deixar o código limpo) ---
const navContainerStyle = {
  background: 'linear-gradient(90deg, #002776, #009c3b)',
  padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
  position: 'sticky', top: 0, zIndex: 100, height: '60px', boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
};

const btnNavStyle = (ativo) => ({
  background: ativo ? 'rgba(255,255,255,0.2)' : 'transparent',
  border: 'none', color: 'white', fontWeight: '700', cursor: 'pointer', padding: '8px 16px', borderRadius: '20px'
});

const inputBuscaStyle = {
  padding: '8px 16px', borderRadius: '20px', border: 'none', width: '150px', fontSize: '14px', outline: 'none'
};

const btnExtraStyle = {
  background: '#fff', color: '#002776', border: 'none', padding: '6px 12px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px'
};

const avatarContainerStyle = {
  height: '36px', width: '36px', borderRadius: '50%', cursor: 'pointer', border: '2px solid white',
  background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden'
};

const btnSairStyle = {
  background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontWeight: '700', fontSize: '12px', cursor: 'pointer', padding: '6px 12px', borderRadius: '20px'
};

export default Layout;