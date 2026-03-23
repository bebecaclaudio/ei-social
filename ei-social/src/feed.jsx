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

  async function publicar() {
    if (novoPost.trim() === '') return
    try {
      await addDoc(collection(db, "posts"), {
        autorUid: usuario?.uid,
        usuario: usuario?.displayName || 'Você',
        avatar: usuario?.photoURL || '🧑',
        texto: novoPost,
        curtidas: 0,
        curtidores: [], 
        data: serverTimestamp()
      })
      setNovoPost('')
    } catch (e) {
      console.error("Erro ao publicar:", e)
    }
  }

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

  function mandarEi(postId, nomeUsuario) {
    if (eiEnviados.includes(postId)) return
    setEiEnviados([...eiEnviados, postId])
    setToast('Ei mandado para ' + nomeUsuario + '!')
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '80px' }}>

      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>

        {/* INPUT DE POSTAGEM - TEXTO ESCURO GARANTIDO */}
        <div style={cardEstilo}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '36px' }}>🧑</span>
            <textarea
              placeholder="No que você está pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={{
                ...textareaEstilo,
                border: focado ? '2px solid #009c3b' : '2px solid #ddd',
                color: '#222', // COR DO TEXTO QUE VOCÊ DIGITA
                backgroundColor: '#ffffff'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px' }}>
            <span style={{ color: focado ? '#009c3b' : '#666', fontSize: '13px' }}>
              {novoPost.length}/280 caracteres
            </span>
            <button onClick={publicar} style={{
              ...btnPublicar,
              background: novoPost.trim() === '' ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)',
              cursor: novoPost.trim() === '' ? 'not-allowed' : 'pointer'
            }}>Publicar</button>
          </div>
        </div>

        {/* LISTA DE POSTS */}
        {posts.map((post) => {
          const eiJaEnviado = eiEnviados.includes(post.id)
          const postCurtidoPorMim = post.curtidores?.includes(usuario?.uid)
          const souEu = post.autorUid === usuario?.uid || post.usuario === (usuario?.displayName || 'Você')

          return (
            <div key={post.id} style={cardEstilo}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>{post.avatar}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#111' }}>{post.usuario}</p>
                  <p style={{ color: '#666', fontSize: '13px' }}>
                    {post.data?.toDate ? post.data.toDate().toLocaleTimeString() : 'agora mesmo'}
                  </p>
                </div>
              </div>

              {/* TEXTO DO POST - COR ESCURA */}
              <p style={{ fontSize: '16px', marginBottom: '16px', whiteSpace: 'pre-wrap', color: '#333' }}>
                {post.texto}
              </p>
              
              <div style={barraAcoes}>
                <button onClick={() => curtir(post)} style={{
                  ...btnAcao,
                  background: postCurtidoPorMim ? '#fff0f0' : 'none',
                  color: postCurtidoPorMim ? '#e00' : '#444'
                }}>
                  {postCurtidoPorMim ? '❤️' : '🤍'} {post.curtidas || 0}
                </button>
                <button style={{...btnAcao, color: '#444'}}>💬 Comentar</button>
                {!souEu && (
                  <button onClick={() => mandarEi(post.id, post.usuario)} style={{
                    ...btnAcao,
                    background: eiJaEnviado ? '#fffbe6' : 'none',
                    color: eiJaEnviado ? '#ffaa00' : '#444'
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

// ESTILOS AJUSTADOS PARA CONTRASTE
const cardEstilo = { background: '#ffffff', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' };
const textareaEstilo = { 
  flex: 1, padding: '12px 16px', borderRadius: '16px', fontSize: '15px', 
  outline: 'none', resize: 'none', height: '90px', fontFamily: 'inherit',
  boxSizing: 'border-box'
};
const btnPublicar = { padding: '10px 28px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '15px', transition: '0.3s' };
const barraAcoes = { display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' };
const btnAcao = { border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: 'bold', padding: '6px 12px', borderRadius: '20px' };
const toastStyle = { position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: 'linear-gradient(90deg, #002776, #009c3b)', color: 'white', padding: '12px 24px', borderRadius: '24px', fontWeight: '700', zIndex: 9999 };

export default Feed;