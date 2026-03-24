import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, onSnapshot } from 'firebase/firestore'

function NavBar({ usuario, telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes }) {
  const [fotoExibir, setFotoExibir] = useState('')

  useEffect(() => {
    // 1. Verificamos se o objeto 'usuario' chegou do App.js
    if (!usuario?.uid) {
      console.log("NavBar: Objeto 'usuario' não chegou ou não tem UID.");
      return
    }

    // 2. Escuta o Firestore em tempo real
    const unsub = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        const urlBanco = docSnap.data().foto;
        console.log("NavBar: Foto encontrada no banco:", urlBanco ? "Sim (Base64)" : "Não");
        setFotoExibir(urlBanco || usuario?.photoURL || '');
      } else {
        console.log("NavBar: Documento não existe no Firestore, usando foto do Google.");
        setFotoExibir(usuario?.photoURL || '');
      }
    }, (erro) => {
      console.error("NavBar: Erro ao acessar Firestore:", erro);
    });

    return () => unsub()
  }, [usuario])

  return (
    <nav style={navStyle}>
      <div style={containerStyle}>
        <h2 style={{ color: 'white', margin: 0, cursor: 'pointer' }} onClick={onFeed}>Ei!</h2>
        
        <div style={menuStyle}>
          <button onClick={onFeed} style={btnStyle(telaAtual === 'feed')}>🏠 Feed</button>
          <button onClick={onComunidades} style={btnStyle(telaAtual === 'comunidades')}>👥 Comunidades</button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          <button onClick={onNotificacoes} style={iconBtnStyle}>🔔</button>
          
          {/* CÍRCULO DO AVATAR - LÓGICA SIMPLIFICADA E DIRETA */}
          <div onClick={onPerfil} style={avatarStyle}>
            { (fotoExibir || usuario?.photoURL) ? (
              <img 
                src={fotoExibir || usuario?.photoURL} 
                alt="" 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  console.log("NavBar: Erro ao carregar SRC da imagem, voltando para ícone.");
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <span style={{ fontSize: '18px' }}>👤</span>
            )}
          </div>
          
          <button onClick={() => window.location.reload()} style={logoutBtnStyle}>Sair</button>
        </div>
      </div>
    </nav>
  )
}

// Estilos (Mantenha os mesmos que você já usa)
const navStyle = { background: '#009c3b', padding: '10px 0', position: 'sticky', top: 0, zIndex: 1000 };
const containerStyle = { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' };
const menuStyle = { display: 'flex', gap: '15px' };
const btnStyle = (ativo) => ({ background: ativo ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' });
const avatarStyle = { width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' };
const iconBtnStyle = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const logoutBtnStyle = { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer' };

export default NavBar;