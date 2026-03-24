import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, onSnapshot } from 'firebase/firestore'

function NavBar({ usuario, telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes }) {
  const [fotoExibir, setFotoExibir] = useState('')

  useEffect(() => {
    if (!usuario?.uid) return

    // Escuta o banco de dados em tempo real para atualizar a foto na barra
    const unsub = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        const dados = docSnap.data()
        // PRIORIDADE: 1º Foto do banco (Base64) | 2º Foto do Google | 3º Vazio
        setFotoExibir(dados.foto || usuario?.photoURL || '')
      } else {
        setFotoExibir(usuario?.photoURL || '')
      }
    })

    return () => unsub()
  }, [usuario])

  // Função de segurança para garantir que links virem <img> e não texto
  const ehLink = (str) => typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:image'));

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
          
          <div onClick={onPerfil} style={avatarStyle}>
            {ehLink(fotoExibir) ? (
              <img src={fotoExibir} alt="" style={imgStyle} />
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

// Estilos mantendo seu padrão visual
const navStyle = { background: '#009c3b', padding: '10px 0', position: 'sticky', top: 0, zIndex: 1000 };
const containerStyle = { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' };
const menuStyle = { display: 'flex', gap: '15px' };
const btnStyle = (ativo) => ({ background: ativo ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' });
const avatarStyle = { width: '34px', height: '34px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' };
const imgStyle = { width: '100%', height: '100%', objectFit: 'cover' };
const iconBtnStyle = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const logoutBtnStyle = { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer', marginLeft: '10px' };

export default NavBar;