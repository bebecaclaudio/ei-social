import { useState, useEffect } from 'react'
import { db } from './firebase-config' 
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove 
} from 'firebase/firestore'

function Feed({ usuario }) {
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [focado, setFocado] = useState(false)
  const [eiEnviados, setEiEnviados] = useState([])
  const [toast, setToast] = useState(null)

  // 1. BUSCAR POSTS DO BANCO (Sincronização em Tempo Real)
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

  // 2. PUBLICAR NOVO POST
  async function publicar() {
    if (novoPost.trim() === '') return
    try {
      await addDoc(collection(db, "posts"), {
        autorUid: usuario?.uid, // Importante para esconder o botão "Ei!" nos seus posts
        usuario: usuario?.displayName || 'Você',
        avatar: usuario?.photoURL || '🧑',
        texto: novoPost,
        curtidas: 0,
        curtidores: [], // Lista de UIDs que deram like
        data: serverTimestamp()
      })
      setNovoPost('')
    } catch (e) {
      console.error("Erro ao publicar:", e)
    }
  }

  // 3. CURTIR (Alternando o Vermelhinho e o Número)
  async function curtir(post) {
    const postRef = doc(db, "posts", post.id)
    const jaCurtiu = post.curtidores?.includes(usuario?.uid)

    try {
      await updateDoc(postRef, {
        curtidas: increment(jaCurtiu ? -1 : 1),
        curtidores: jaCurtiu ? arrayRemove(usuario?.uid) : arrayUnion(usuario?.uid)
      })
    } catch (e) {
      console.error("Erro ao curtir:", e)
    }
  }

  // 4. MANDAR EI (Feedback visual amarelo)
  function mandarEi(postId, nomeUsuario) {
    if (eiEnviados.includes(postId)) return
    setEiEnviados([...eiEnviados, postId])
    setToast('Ei mandado para ' + nomeUsuario + '!')
    setTimeout(function() { setToast(null) }, 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>

      {/* NOTIFICAÇÃO TOAST */}
      {toast && (
        <div style={toastStyle}>{toast}</div>
      )}

      <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 16px' }}>

        {/* ÁREA DE POSTAGEM */}
        <div style={cardEstilo}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '36px' }}>{usuario?.photoURL ? '🖼️' : '🧑'}</span>
            <textarea
              placeholder="No que voce esta pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={{
                ...textareaEstilo,
                border: focado ? '2px solid #009c3b' : '2px solid #ddd'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ color: focado ? '#009c3b' : '#aaa', fontSize: '13px' }}>
              {novoPost.length}/280 caracteres
            </span>
            <button onClick={publicar} style={{
              ...btnPublicar,
              background: novoPost.trim() === '' ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)',
              cursor: novoPost.trim() === '' ? 'not-allowed' : 'pointer'
            }}>Publicar</button>
          </div>
        </div>

        {/* LISTA DE POSTS DINÂMICA */}
        {posts.map((post) => {
          const eiJaEnviado = eiEnviados.includes(post.id)
          const postCurtidoPorMim = post.curtidores?.includes(usuario?.uid)
          const souEu = post.autorUid === usuario?.uid

          return (
            <div key={post.id} style={cardEstilo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>{post.avatar}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px' }}>{post.usuario}</p>
                  <p style={{ color: '#888', fontSize: '13px' }}>
                    {post.data?.toDate ? post.data.toDate().toLocaleTimeString() : 'agora mesmo'}
                  </p>
                </div>
              </div>

              <p style={{ fontSize: '16px', marginBottom: '16px', whiteSpace: 'pre-wrap' }}>
                {post.texto}
              </p>
              
              <div style={barraAcoes}>
                {/* BOTÃO CURTIR - O VERMELHINHO VOLTOU */}
                <button onClick={() => curtir(post)} style={{
                  ...btnAcao,
                  background: postCurtidoPorMim ? '#fff0f0' : 'none',
                  color: postCurtidoPorMim ? '#e00' : '#555'
                }}>
                  {postCurtidoPorMim ? '❤️' : '🤍'} {post.curtidas || 0}
                </button>

                <button style={btnAcao}>💬 Comentar</button>

                {/* BOTÃO EI! - Só aparece se NÃO for o seu post */}
                {!souEu && (
                  <button onClick={() => mandarEi(post.id, post.usuario)} style={{
                    ...btnAcao,
                    background: eiJaEnviado ? '#fffbe6' : 'none',
                    color: eiJaEnviado ? '#ffaa00' : '#555',
                    cursor: eiJaEnviado ? 'default' : 'pointer'
                  }}>
                    {eiJaEnviado ? '👋 Ei enviado!' : '👋 Ei!'}
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ESTILOS (Mantendo seu padrão visual)
const cardEstilo = { background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const textareaEstilo = { flex: 1, padding: '12px 16px', borderRadius: '16px', fontSize: '15px', outline: 'none', background: 'white', resize: 'none', height: '80px', fontFamily: 'sans-serif', color: '#333' };
const btnPublicar = { padding: '10px 28px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '15px' };
const barraAcoes = { display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' };
const btnAcao = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', color: '#555', padding: '6px 12px', borderRadius: '20px', transition: 'all 0.2s' };
const toastStyle = { position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #002776, #009c3b)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontWeight: '700', fontSize: '15px', zIndex: 999, boxShadow: '0 4px 20px rgba(0,0,0,0.2)' };

export default Feed;