import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from './firebase-config' 
import { doc, onSnapshot } from 'firebase/firestore'

function Layout({ children, usuario, onSair }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fotoExibir, setFotoExibir] = useState('')

  // 1. ESCUTA A FOTO DO PERFIL EM TEMPO REAL
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

  // 2. LÓGICA DE MUDANÇA CONFORME A PÁGINA
  const isAtivo = (path) => location.pathname === path;

  // Renderiza elementos diferentes na barra dependendo de onde você está
  const renderConteudoDireito = () => {
    if (location.pathname === '/perfil') {
      return <span style={{ color: 'white', fontWeight: 'bold' }}>Configurações do Perfil</span>;
    }
    if (location.pathname === '/comunidades') {
      return <span style={{ color: 'white', fontWeight: 'bold' }}>Explorar Grupos</span>;
    }
    // Padrão para o Feed: Barra de Busca
    return (
      <input 
        placeholder="Buscar na Pleiadians..." 
        style={{
          padding: '8px 16px', borderRadius: '20px',
          border: 'none', width: '180px', fontSize: '14px', outline: 'none'
        }} 
      />
    );
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      
      {/* --- BARRA DE NAVEGAÇÃO DINÂMICA --- */}
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
        height: '60px',
        boxSizing: 'border-box'
      }}>
        
        {/* LOGO */}
        <div style={{ display: 'flex', alignItems: 'center', minWidth: '40px' }}>
          <img
            onClick={() => navigate('/feed')}
            src="/logo.png"
            alt="Ei"
            style={{ height: '40px', width: '40px', cursor: 'pointer', objectFit: 'contain' }}
          />
        </div>

        {/* BOTÕES CENTRAIS (MUDAM O BRILHO CONFORME A ROTA) */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/feed')} style={{
            background: isAtivo('/feed') ? 'rgba(255,255,255,0.3)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', padding: '8px 16px',
            borderRadius: '20px', transition: '0.2s'
          }}>🏠 Feed</button>

          <button onClick={() => navigate('/comunidades')} style={{
            background: isAtivo('/comunidades') ? 'rgba(255,255,255,0.3)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', padding: '8px 16px',
            borderRadius: '20px', transition: '0.2s'
          }}>👥 Comunidades</button>
        </div>

        {/* LADO DIREITO: MUDANÇA DINÂMICA + PERFIL */}
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          
          {/* Aqui entra o que definimos na função lá em cima */}
          <div style={{ display: 'none', display: 'md-block' }}> 
            {renderConteudoDireito()}
          </div>
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* AVATAR SINCRONIZADO */}
            <div 
              onClick={() => navigate('/perfil')} 
              style={{
                height: '38px', width: '38px', borderRadius: '50%',
                cursor: 'pointer', border: '2px solid white',
                background: 'white', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              {(fotoExibir || usuario?.photoURL) ? (
                <img 
                  src={fotoExibir || usuario?.photoURL} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                  alt=""
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: '20px' }}>👤</span>
              )}
            </div>

            <button onClick={onSair} style={{
                background: 'rgba(255,255,255,0.2)', border: 'none',
                color: 'white', fontWeight: '700', fontSize: '12px',
                cursor: 'pointer', padding: '6px 12px', borderRadius: '20px'
            }}>Sair</button>
          </div>
        </div>
      </div>

      {/* --- ÁREA DE CONTEÚDO --- */}
      <main style={{ flex: 1, background: '#f0f2f5', color: '#333', paddingTop: '20px' }}>
        {children} 
      </main>

    </div>
  )
}

export default Layout;