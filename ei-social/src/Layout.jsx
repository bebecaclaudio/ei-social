function Layout({ tela, onFeed, onComunidades, onPerfil }) {
  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* Navbar única no topo */}
      <div style={{
        background: 'linear-gradient(90deg, #002776, #009c3b)',
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)'
      }}>
        {/* Logo */}
        <img
          onClick={onFeed}
          src="/logo.png"
          alt="Ei"
          style={{ height: '40px', cursor: 'pointer' }}
        />

        {/* Links de navegação */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button onClick={onFeed} style={{
            background: tela === 'feed' ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', padding: '8px 16px',
            borderRadius: '20px', transition: 'all 0.2s'
          }}>🏠 Feed</button>

          <button onClick={onComunidades} style={{
            background: tela === 'comunidades' ? 'rgba(255,255,255,0.2)' : 'transparent',
            border: 'none', color: 'white', fontWeight: '700',
            fontSize: '14px', cursor: 'pointer', padding: '8px 16px',
            borderRadius: '20px', transition: 'all 0.2s'
          }}>👥 Comunidades</button>
        </div>

        {/* Busca e perfil */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <input placeholder="Buscar..." style={{
            padding: '8px 16px', borderRadius: '20px',
            border: 'none', width: '180px', fontSize: '14px', outline: 'none'
          }} />
          <img
            onClick={onPerfil}
            src="/logo.png"
            alt="Perfil"
            style={{
              height: '36px', width: '36px', borderRadius: '50%',
              cursor: 'pointer', border: '2px solid white',
              objectFit: 'cover', background: 'white'
            }}
          />
        </div>
      </div>

    </div>
  )
}

export default Layout