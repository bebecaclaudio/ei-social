import { useState, useEffect } from 'react'
import { db } from './firebase-config' 
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, serverTimestamp, doc, updateDoc, increment 
} from 'firebase/firestore'

function Feed({ usuario }) {
  // Agora os posts começam vazios e o Firebase preenche
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [focado, setFocado] = useState(false)
  const [eiEnviados, setEiEnviados] = useState([])
  const [toast, setToast] = useState(null)

  // --- 1. BUSCAR POSTS (Sincronização com o Banco) ---
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("data", "desc"))
    
    const unsub = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setPosts(postsData)
    })
    return () => unsub()
  }, [])

  // --- 2. PUBLICAR (Envia para o Banco) ---
  async function publicar() {
    if (novoPost.trim() === '') return
    
    try {
      await addDoc(collection(db, "posts"), {
        usuario: usuario?.displayName || 'Voce',
        texto: novoPost,
        curtidas: 0,
        curtidores: [], // Lista para saber quem já clicou no ❤️
        avatar: usuario?.photoURL || '🧑',
        data: serverTimestamp()
      })
      setNovoPost('')
    } catch (e) {
      console.error("Erro ao publicar:", e)
    }
  }

  // --- 3. CURTIR (O segredo do vermelhinho com Firebase) ---
  async function curtir(id, postSendoClicado) {
    const postRef = doc(db, "posts", id)
    
    // Verificamos se o usuário atual já curtiu esse post
    // Para simplificar agora, usamos o UID do usuário
    const jaCurtiu = postSendoClicado.curtidores?.includes(usuario?.uid)

    try {
      await updateDoc(postRef, {
        curtidas: increment(jaCurtiu ? -1 : 1),
        // Adiciona ou remove o ID do usuário da lista de curtidores
        curtidores: jaCurtiu 
          ? postSendoClicado.curtidores.filter(uid => uid !== usuario?.uid)
          : [...(postSendoClicado.curtidores || []), usuario?.uid]
      })
    } catch (e) {
      console.error("Erro ao curtir:", e)
    }
  }

  function mandarEi(postId, nomeUsuario) {
    if (eiEnviados.includes(postId)) return
    setEiEnviados([...eiEnviados, postId])
    setToast('Ei mandado para ' + nomeUsuario + '!')
    setTimeout(function() { setToast(null) }, 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #002776, #009c3b)',
          color: 'white', padding: '12px 24px', borderRadius: '24px',
          fontWeight: '700', fontSize: '15px', zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {toast}
        </div>
      )}

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
          // Aqui a mágica: verificamos se o seu ID está na lista de curtidores do post
          const postCurtidoPorMim = post.curtidores?.includes(usuario?.uid)

          return (
            <div key={post.id} style={{
              background: 'white', borderRadius: '16px',
              padding: '20px', marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>{post.avatar || '👤'}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px' }}>{post.usuario}</p>
                  <p style={{ color: '#888', fontSize: '13px' }}>
                    {post.data?.toDate ? post.data.toDate().toLocaleTimeString() : 'agora mesmo'}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '16px', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>{post.texto}</p>
              
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
                
                {/* BOTÃO CURTIR: Mantém seu estilo exato */}
                <button onClick={function() { curtir(post.id, post) }} style={{
                  border: 'none', 
                  background: postCurtidoPorMim ? '#fff0f0' : 'none',
                  cursor: 'pointer', fontSize: '14px', fontWeight: 'bold',
                  color: postCurtidoPorMim ? '#e00' : '#555',
                  padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s'
                }}>
                  {postCurtidoPorMim ? '❤️' : '🤍'} {post.curtidas || 0}
                </button>

                <button style={{
                  border: 'none', background: 'none', cursor: 'pointer',
                  fontSize: '14px', color: '#555', fontWeight: 'bold',
                  padding: '6px 12px', borderRadius: '20px'
                }}>💬 Comentar</button>

                <button onClick={function() { mandarEi(post.id, post.usuario) }} style={{
                  border: 'none',
                  background: eiJaEnviado ? '#fffbe6' : 'none',
                  cursor: eiJaEnviado ? 'default' : 'pointer',
                  fontSize: '14px', fontWeight: 'bold',
                  color: eiJaEnviado ? '#ffaa00' : '#555',
                  padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s'
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