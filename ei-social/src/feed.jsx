import { useState, useEffect } from 'react'
import { db } from './firebase-config' 
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  updateDoc,
  increment 
} from "https://www.gstatic.com/firebasejs/12.11.0/firebase-firestore.js";

function Feed({ onPerfil, onComunidades }) {
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [focado, setFocado] = useState(false)
  const [eiEnviados, setEiEnviados] = useState([])
  const [toast, setToast] = useState(null)

  // 1. ESCUTAR O BANCO DE DADOS (Tempo Real)
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("data", "desc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsFirebase = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsFirebase);
    });

    return () => unsubscribe(); // Limpa a conexão ao fechar a página
  }, []);

  // 2. PUBLICAR NO FIREBASE
  async function publicar() {
    if (novoPost.trim() === '') return
    
    try {
      await addDoc(collection(db, "posts"), {
        usuario: 'Sofia Rebeca',
        texto: novoPost,
        curtidas: 0,
        avatar: '🧑',
        data: serverTimestamp()
      });
      setNovoPost('');
    } catch (error) {
      console.error("Erro ao salvar:", error);
    }
  }

  // 3. CURTIR (Atualiza no Firebase)
  async function curtir(id, jaCurtido) {
    const postRef = doc(db, "posts", id);
    await updateDoc(postRef, {
      curtidas: increment(jaCurtido ? -1 : 1)
    });
  }

  function mandarEi(postId, usuario) {
    if (eiEnviados.includes(postId)) return
    setEiEnviados([...eiEnviados, postId])
    setToast(`Ei mandado para ${usuario}! 👋`)
    setTimeout(() => setToast(null), 3000)
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'sans-serif' }}>
      
      {/* Notificação Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(90deg, #002776, #009c3b)', color: 'white',
          padding: '12px 24px', borderRadius: '24px', fontWeight: '700', zIndex: 999,
          boxShadow: '0 4px 20px rgba(0,0,0,0.2)'
        }}>
          {toast}
        </div>
      )}

      {/* Header Estilo Orkut/Ei */}
      <div style={{
        background: 'linear-gradient(90deg, #002776, #009c3b)', padding: '12px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <h1 style={{ color: 'white', fontSize: '32px', fontWeight: '900', margin: 0 }}>Ei</h1>
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
            <span onClick={onComunidades} style={{ color: 'white', fontSize: '14px', fontWeight: '700', cursor: 'pointer' }}>👥 Comunidades</span>
            <input placeholder="Buscar..." style={{ padding: '8px 16px', borderRadius: '20px', border: 'none', width: '150px' }} />
            <div onClick={onPerfil} style={{ color: 'white', fontSize: '24px', cursor: 'pointer' }}>👤</div>
        </div>
      </div>

      <div style={{ maxWidth: '600px', margin: '24px auto', padding: '0 16px' }}>
        
        {/* Caixa de Texto */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '16px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🧑</span>
            <textarea
              placeholder="No que você está pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={{
                flex: 1, padding: '12px', borderRadius: '12px', border: focado ? '2px solid #009c3b' : '2px solid #ddd',
                fontSize: '15px', outline: 'none', resize: 'none', height: '80px'
              }}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
            <span style={{ color: '#aaa', fontSize: '12px' }}>{novoPost.length}/280</span>
            <button onClick={publicar} style={{
              padding: '8px 24px', borderRadius: '8px', border: 'none',
              background: novoPost.trim() === '' ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)',
              color: 'white', fontWeight: 'bold', cursor: 'pointer'
            }}>Publicar</button>
          </div>
        </div>

        {/* Lista de Posts */}
        {posts.map((post) => (
          <div key={post.id} style={{ background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
              <span style={{ fontSize: '40px' }}>{post.avatar || '👤'}</span>
              <div>
                <p style={{ fontWeight: 'bold', margin: 0 }}>{post.usuario}</p>
                <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Enviado para o Ei</p>
              </div>
            </div>
            <p style={{ fontSize: '16px', whiteSpace: 'pre-wrap' }}>{post.texto}</p>
            
            <div style={{ display: 'flex', gap: '10px', borderTop: '1px solid #eee', paddingTop: '12px' }}>
              <button onClick={() => curtir(post.id, false)} style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>
                🤍 {post.curtidas || 0}
              </button>
              <button style={{ border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', color: '#555' }}>💬 Comentar</button>
              <button onClick={() => mandarEi(post.id, post.usuario)} style={{ 
                border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', 
                color: eiEnviados.includes(post.id) ? '#ffaa00' : '#555' 
              }}>
                👋 {eiEnviados.includes(post.id) ? 'Ei enviado!' : 'Ei!'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Feed