import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { collection, query, where, onSnapshot } from 'firebase/firestore'

function NavBar({ telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes, usuarioUid }) {
  const [totalNotificacoes, setTotalNotificacoes] = useState(0)

  // ESCUTAR NOTIFICAÇÕES NÃO LIDAS
  useEffect(() => {
    if (!usuarioUid) return

    // Busca apenas as que são para VOCÊ e que NÃO foram lidas
    const q = query(
      collection(db, "notificacoes"),
      where("paraUid", "==", usuarioUid),
      where("lida", "==", false)
    )

    const unsub = onSnapshot(q, (snapshot) => {
      setTotalNotificacoes(snapshot.docs.length)
    })

    return () => unsub()
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
      alignItems: 'center', padding: '8px 0 12px', z_index: 999,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
    }}>
      {botoes.map(function(botao) {
        const ativo = telaAtual === botao.tela
        const ehNotificacao = botao.tela === 'notificacoes'

        return (
          <button
            key={botao.tela}
            onClick={botao.acao}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              gap: '4px', border: 'none', background: 'none', cursor: 'pointer',
              padding: '8px 16px', borderRadius: '12px',
              background: ativo ? 'linear-gradient(135deg, #002776, #009c3b)' : 'none',
              transition: 'all 0.2s', position: 'relative' // Necessário para a bolinha
            }}>
            
            {/* BOLINHA VERMELHA (SÓ NO BOTÃO DE NOTIFICAÇÕES) */}
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

            <span style={{ fontSize: '22px' }}>{botao.emoji}</span>
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