import { useState, useEffect } from 'react' // Adicionamos o db e o onSnapshot aqui
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from './firebase-config' 
import { doc, onSnapshot } from 'firebase/firestore'

function Layout({ children, usuario, onSair }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [fotoExibir, setFotoExibir] = useState('') // Estado para a foto do banco

  // EFEITO PARA BUSCAR A FOTO NO FIRESTORE
  useEffect(() => {
    if (!usuario?.uid) return

    const unsub = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        // Prioridade: Foto do banco > Foto do Google
        setFotoExibir(docSnap.data().foto || usuario?.photoURL || '')
      } else {
        setFotoExibir(usuario?.photoURL || '')
      }
    })
    return () => unsub()
  }, [usuario])

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

        {/* BOTÕES CENTRAIS */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={() => navigate('/feed')} style={{
            background: isAtivo('/feed') ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer'
          }}>🏠 Feed</button>

          <button onClick={() => navigate('/comunidades')} style={{
            background: isAtivo('/comunidades') ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer'
          }}>👥 Comunidades</button>
        </div>

        {/* BUSCA E PERFIL */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input 
            placeholder="Buscar..." 
            style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', width: '180px', fontSize: '14px', outline: 'none' }} 
          />
          
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            
            {/* ÍCONE DE PERFIL CORRIGIDO */}
            <div 
              onClick={() => navigate('/perfil')} 
              style={{
                height: '36px', width: '36px', borderRadius: '50%',
                cursor: 'pointer', border: '2px solid white',
                background: 'white', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                overflow: 'hidden'
              }}
            >
              {/* Lógica de exibição: prioriza fotoExibir (Banco) depois Google */}
              {(fotoExibir || usuario?.photoURL) ? (
                <img 
                  src={fotoExibir || usuario?.photoURL} 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <span style={{ fontSize: '20px' }}>👤</span>
              )}
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
      <main style={{ flex: 1, background: '#f0f2f5', color: '#333', paddingTop: '20px' }}>
        {children} 
      </main>
    </div>
  )
}

export default Layout;