import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'

function NavBar({ telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes, usuario }) {
  const [totalNotificacoes, setTotalNotificacoes] = useState(0)
  const [fotoExibir, setFotoExibir] = useState('')

  // ESCUTAR DADOS DO USUÁRIO (FOTO) EM TEMPO REAL
  useEffect(() => {
    if (!usuario?.uid) return

    // Criamos um "ouvinte" no Firestore para pegar a foto em Base64
    const unsubPerfil = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        // PRIORIDADE: 1º Foto do Firestore (Base64) | 2º Foto do Google Auth | 3º Vazio
        setFotoExibir(data.foto || usuario?.photoURL || '')
      } else {
        // Se o documento no Firestore ainda não existe, usamos a do Google
        setFotoExibir(usuario?.photoURL || '')
      }
    })

    return () => unsubPerfil()
  }, [usuario])

  // ESCUTAR NOTIFICAÇÕES EM TEMPO REAL
  useEffect(() => {
    if (!usuario?.uid) return

    const q = query(
      collection(db, "notificacoes"),
      where("paraUid", "==", usuario.uid),
      where("lida", "==", false)
    )

    const unsubNotif = onSnapshot(q, (snapshot) => {
      setTotalNotificacoes(snapshot.docs.length)
    })

    return () => unsubNotif()
  }, [usuario])

  const botoes = [
    { label: 'Feed', emoji: '🏠', tela: 'feed', acao: onFeed },
    { label: 'Comunidades', emoji: '👥', tela: 'comunidades', acao: onComunidades },
    { label: 'Notificações', emoji: '🔔', tela: 'notificacoes', acao: onNotificacoes },
    { label: 'Perfil', emoji: '👤', tela: 'perfil', acao: onPerfil },
  ]

  return (
    <div style={navStyle}>
      {botoes.map((botao) => {
        const ativo = telaAtual === botao.tela
        const ehNotificacao = botao.tela === 'notificacoes'
        const ehPerfil = botao.tela === 'perfil'

        return (
          <button
            key={botao.tela}
            onClick={botao.acao}
            style={{
              ...btnBaseStyle,
              background: ativo ? 'linear-gradient(135deg, #002776, #009c3b)' : 'none',
            }}
          >
            {/* BADGE DE NOTIFICAÇÕES */}
            {ehNotificacao && totalNotificacoes > 0 && (
              <span style={badgeStyle}>{totalNotificacoes}</span>
            )}

            {/* ÍCONE OU FOTO DE PERFIL */}
            <div style={avatarContainerStyle}>
              {ehPerfil && fotoExibir ? (
                <img 
                  src={fotoExibir} 
                  alt="Perfil" 
                  style={imgStyle} 
                />
              ) : (
                <span style={{ fontSize: '22px' }}>{botao.emoji}</span>
              )}
            </div>

            <span style={{
              fontSize: '11px', 
              fontWeight: '700',
              color: ativo ? 'white' : '#888'
            }}>
              {botao.label}
            </span>
          </button>
        )
      })}
    </div>
  )
}

// --- ESTILOS ---
const navStyle = {
  position: 'fixed', bottom: 0, left: 0, right: 0,
  background: 'white', borderTop: '1px solid #eee',
  display: 'flex', justifyContent: 'space-around',
  alignItems: 'center', padding: '8px 0 12px', 
  zIndex: 1000,
  boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
};

const btnBaseStyle = {
  display: 'flex', flexDirection: 'column', alignItems: 'center',
  gap: '4px', border: 'none', background: 'none', cursor: 'pointer',
  padding: '8px 16px', borderRadius: '12px',
  transition: 'all 0.2s', position: 'relative'
};

const avatarContainerStyle = {
  width: '26px', height: '26px', borderRadius: '50%',
  overflow: 'hidden', display: 'flex', alignItems: 'center',
  justifyContent: 'center', background: '#f0f0f0'
};

const imgStyle = { 
  width: '100%', 
  height: '100%', 
  objectFit: 'cover' 
};

const badgeStyle = {
  position: 'absolute', top: '4px', right: '14px',
  background: '#ff3b30', color: 'white', fontSize: '10px',
  fontWeight: 'bold', minWidth: '18px', height: '18px',
  borderRadius: '50%', display: 'flex', alignItems: 'center',
  justifyContent: 'center', border: '2px solid white',
  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
};

export default NavBar;