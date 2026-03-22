import { useState } from 'react'

function Feed({ onPerfil, onComunidades }) {
  const [posts, setPosts] = useState([
    { id: 1, usuario: 'Maria Silva', texto: 'Saudades do Orkut!', curtidas: 42, curtido: false, avatar: '👩' },
    { id: 2, usuario: 'Joao Santos', texto: 'Ei e a melhor rede social BR!', curtidas: 87, curtido: false, avatar: '👨' },
    { id: 3, usuario: 'Ana Costa', texto: 'Alguem lembra dos scraps? Que nostalgia...', curtidas: 31, curtido: false, avatar: '👩' },
  ])

  const [novoPost, setNovoPost] = useState('')
  const [focado, setFocado] = useState(false)
  const [eiEnviados, setEiEnviados] = useState([])
  const [toast, setToast] = useState(null)

  function publicar() {
    if (novoPost.trim() === '') return
    const post = {
      id: Date.now(),
      usuario: 'Voce',
      texto: novoPost,
      curtidas: 0,
      curtido: false,
      avatar: '🧑'
    }
    setPosts([post, ...posts])
    setNovoPost('')
  }

  function curtir(id) {
    setPosts(posts.map(function(post) {
      if (post.id === id) {
        return {
          ...post,
          curtido: !post.curtido,
          curtidas: post.curtido ? post.curtidas - 1 : post.curtidas + 1
        }
      }
      return post
    }))
  }

  function mandarEi(postId, usuario) {
    if (eiEnviados.includes(postId)) return
    setEiEnviados([...eiEnviados, postId])
    setToast('Ei mandado para ' + usuario + '! 👋')
    setTimeout(function() { setToast(null) }, 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* Toast de notificacao */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #002776, #009c3b)',
          color: 'white', padding: '12px 24px', borderRadius: '24px',
          fontWeight: '700', fontSize: '15px', zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          animation: 'fadeIn 0.3s ease'
        }}>
          {toast}
        </div>
      )}

      <div style={{
        background: 'linear-gradient(90deg, #002776, #009c3b)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '900' }}>Ei</h1>
        <span onClick={onComunidades} style={{ color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>
          👥 Comunidades
        </span>
        <input placeholder="Buscar..." style={{
          padding: '8px 16px', borderRadius: '20px',
          border: 'none', width: '180px', fontSize: '14px'
        }} />
        <div onClick={onPerfil} style={{ color: 'white', fontSize: '24px', cursor: 'pointer' }}>👤</div>
      </div>

      <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 16px' }}>

        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '16px', marginBottom: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '36px' }}>🧑</span>
            <textarea
              placeholder="No que voce esta pensando?"
              value={novoPost}
              onChange={function(e) { setNovoPost(e.target.value) }}
              onFocus={function() { setFocado(true) }}
              onBlur={function() { setFocado(false) }}
              style={{
                flex: 1, padding: '12px 16px', borderRadius: '16px',
                border: focado ? '2px solid #009c3b' : '2px solid #ddd',
                fontSize: '15px', outline: 'none', background: 'white',
                resize: 'none', height: '80px', fontFamily: 'sans-serif', color: '#333'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ color: focado ? '#009c3b' : '#aaa', fontSize: '13px' }}>
              {novoPost.length}/280 caracteres
            </span>
            <button onClick={publicar} style={{
              padding: '10px 28px', borderRadius: '10px', border: 'none',
              background: novoPost.trim() === '' ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)',
              color: 'white', fontWeight: 'bold', fontSize: '15px',
              cursor: novoPost.trim() === '' ? 'not-allowed' : 'pointer'
            }}>Publicar</button>
          </div>
        </div>

        {posts.map(function(post) {
          const eiJaEnviado = eiEnviados.includes(post.id)
          return (
            <div key={post.id} style={{
              background: 'white', borderRadius: '16px',
              padding: '20px', marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>{post.avatar}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px' }}>{post.usuario}</p>
                  <p style={{ color: '#888', fontSize: '13px' }}>agora mesmo</p>
                </div>
              </div>
              <p style={{ fontSize: '16px', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{post.texto}</p>
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                <button onClick={function() { curtir(post.id) }} style={{
                  border: 'none',
                  background: post.curtido ? '#fff0f0' : 'none',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                  color: post.curtido ? '#e00' : '#555',
                  padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s'
                }}>
                  {post.curtido ? '❤️' : '🤍'} {post.curtidas}
                </button>

                <button style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '14px', color: '#555', fontWeight: 'bold',
                  padding: '6px 12px', borderRadius: '20px'
                }}>💬 Comentar</button>

                <button
                  onClick={function() { mandarEi(post.id, post.usuario) }}
                  style={{
                    border: 'none',
                    background: eiJaEnviado ? '#fffbe6' : 'none',
                    cursor: eiJaEnviado ? 'default' : 'pointer',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: eiJaEnviado ? '#ffaa00' : '#555',
                    padding: '6px 12px',
                    borderRadius: '20px',
                    transition: 'all 0.2s',
                    transform: eiJaEnviado ? 'scale(1.1)' : 'scale(1)'
                  }}>
                  {eiJaEnviado ? '👋 Ei enviado!' : '👋 Ei!'}
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Feed