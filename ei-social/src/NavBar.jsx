import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore'

function NavBar({ telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes, usuarioUid }) {
  const [totalNotificacoes, setTotalNotificacoes] = useState(0)
  const [fotoPerfil, setFotoPerfil] = useState('') // Estado para a foto em Base64

  // ESCUTAR DADOS DO USUÁRIO (FOTO DE PERFIL) EM TEMPO REAL
  useEffect(() => {
    if (!usuarioUid) return

    // Criamos um "ouvinte" direto no documento do usuário no Firestore
    const unsubPerfil = onSnapshot(doc(db, "usuarios", usuarioUid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data()
        setFotoPerfil(data.foto || '') // Pega a string Base64 do campo 'foto'
      }
    })

    return () => unsubPerfil()
  }, [usuarioUid])

  // ESCUTAR NOTIFICAÇÕES EM TEMPO REAL
  useEffect(() => {
    if (!usuarioUid) return

    const q = query(
      collection(db, "notificacoes"),
      where("paraUid", "==", usuarioUid),
      where("lida", "==", false)
    )

    const unsubNotif = onSnapshot(q, (snapshot) => {
      setTotalNotificacoes(snapshot.docs.length)
    })

    return () => unsubNotif()
  }, [usuarioUid])

  const botoes = [
    { label: 'Feed', emoji: '🏠', tela: 'feed', acao: onFeed },
    { label: 'Comunidades', emoji: '👥', tela: 'comunidades', acao: onComunidades },
    { label: 'Notificações', emoji: '🔔', tela: 'notificacoes', acao: onNotificacoes },
    { label: 'Perfil', emoji: '👤', tela: 'perfil', acao: onPerfil },
  ]

  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0,
      background: 'white', borderTop: '1px solid #eee',
      display: 'flex', justifyContent: 'space-around',
      alignItems: 'center', padding: '8px 0 12px', 
      zIndex: 1000,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
    }}>
      {botoes.map(function(botao) {
        const ativo = telaAtual === botao.tela
        const ehNotificacao = botao.tela === 'notificacoes'
        const ehPerfil = botao.tela === 'perfil'

        return (
          <button
            key={botao.tela}
            onClick={botao.acao}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', border: 'none', background: 'none', cursor: 'pointer',
              padding: '8px 16px', borderRadius: '12px',
              background: ativo ? 'linear-gradient(135deg, #002776, #009c3b)' : 'none',
              transition: 'all 0.2s', position: 'relative'
            }}>
            
            {/* BOLINHA DE NOTIFICAÇÃO */}
            {ehNotificacao && totalNotificacoes > 0 && (
              <span style={{
                position: 'absolute', top: '4px', right: '14px',
                background: '#ff3b30', color: 'white', fontSize: '10px',
                fontWeight: 'bold', minWidth: '18px', height: '18px',
                borderRadius: '50%', display: 'flex', alignItems: 'center',
                justifyContent: 'center', border: '2px solid white',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
              }}>
                {totalNotificacoes}
              </span>
            )}

            {/* ÍCONE OU FOTO DE PERFIL */}
            <div style={{
              width: '26px', height: '26px', borderRadius: '50%',
              overflow: 'hidden', display: 'flex', alignItems: 'center',
              justifyContent: 'center', background: '#f0f0f0'
            }}>
              {ehPerfil && fotoPerfil ? (
                <img 
                  src={fotoPerfil} 
                  alt="Perfil" 
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                />
              ) : (
                <span style={{ fontSize: '22px' }}>{botao.emoji}</span>
              )}
            </div>

            <span style={{
              fontSize: '11px', fontWeight: '700',
              color: ativo ? 'white' : '#888'
            }}>{botao.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default NavBar