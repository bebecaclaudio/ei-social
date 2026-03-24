import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, onSnapshot } from 'firebase/firestore'

function NavBar({ usuario, telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes }) {
  const [fotoExibir, setFotoExibir] = useState('')

  useEffect(() => {
    // 1. Se não houver usuário logado, não faz nada
    if (!usuario?.uid) return

    // 2. Criamos um "ouvinte" (onSnapshot) específico para o documento da Sofia no Firestore
    const unsub = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        const dados = docSnap.data()
        // PRIORIDADE: Foto do Banco (Base64) > Foto do Google > Vazio
        setFotoExibir(dados.foto || usuario?.photoURL || '')
      } else {
        // Se o documento ainda não existir no banco, usa a do Google
        setFotoExibir(usuario?.photoURL || '')
      }
    })

    return () => unsub() // Limpa o ouvinte ao fechar o componente
  }, [usuario])

  // 3. Função de segurança para não deixar o link virar texto
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
          
          {/* CÍRCULO DO AVATAR NA NAVBAR (VERSÃO BLINDADA) */}
          <div onClick={onPerfil} style={avatarStyle}>
            {/* Tentamos renderizar a imagem se houver QUALQUER link válido */}
            {(fotoExibir || usuario?.photoURL) ? (
              <img 
                src={fotoExibir || usuario?.photoURL} 
                alt="" 
                // O segredo está em garantir que o erro de carregamento não trave a UI
                onError={(e) => { e.target.style.display = 'none'; }} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            ) : (
              /* Se realmente não houver nada, aí sim mostramos o ícone */
              <span style={{ fontSize: '18px' }}>👤</span>
            )}
          </div>
          
          <button onClick={() => window.location.reload()} style={logoutBtnStyle}>Sair</button>
        </div>
      </div>
    </nav>
  )
}

// Estilos (mantive o padrão verde que você gosta)
const navStyle = { background: '#009c3b', padding: '10px 0', position: 'sticky', top: 0, zIndex: 1000 };
const containerStyle = { maxWidth: '1000px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px' };
const menuStyle = { display: 'flex', gap: '15px' };
const btnStyle = (ativo) => ({ background: ativo ? 'rgba(255,255,255,0.2)' : 'none', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer', padding: '8px 12px', borderRadius: '8px' });
const avatarStyle = { width: '38px', height: '38px', borderRadius: '50%', overflow: 'hidden', cursor: 'pointer', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' };
const iconBtnStyle = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const logoutBtnStyle = { background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '5px 15px', borderRadius: '20px', cursor: 'pointer' };

export default NavBar;