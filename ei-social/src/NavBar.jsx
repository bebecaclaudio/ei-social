function NavBar({ telaAtual, onFeed, onComunidades, onPerfil, onNotificacoes }) {
  const botoes = [
    { label: 'Feed', emoji: '🏠', tela: 'feed', acao: onFeed },
    { label: 'Comunidades', emoji: '👥', tela: 'comunidades', acao: onComunidades },
    { label: 'Notificacoes', emoji: '🔔', tela: 'notificacoes', acao: onNotificacoes },
    { label: 'Perfil', emoji: '👤', tela: 'perfil', acao: onPerfil },
  ]

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      borderTop: '1px solid #eee',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      padding: '8px 0 12px',
      zIndex: 999,
      boxShadow: '0 -4px 20px rgba(0,0,0,0.08)'
    }}>
      {botoes.map(function(botao) {
        const ativo = telaAtual === botao.tela
        return (
          <button
            key={botao.tela}
            onClick={botao.acao}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              padding: '8px 16px',
              borderRadius: '12px',
              background: ativo ? 'linear-gradient(135deg, #002776, #009c3b)' : 'none',
              transition: 'all 0.2s'
            }}>
            <span style={{ fontSize: '22px' }}>{botao.emoji}</span>
            <span style={{
              fontSize: '11px',
              fontWeight: '700',
              color: ativo ? 'white' : '#888'
            }}>{botao.label}</span>
          </button>
        )
      })}
    </div>
  )
}

export default NavBar