import { useState, useEffect } from 'react'
import { db } from './firebase-config' 
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove,
  deleteDoc, getDoc 
} from 'firebase/firestore'

// --- COMPONENTE: BUSCA FOTO NO BANCO OU USA GOOGLE (SEM MOSTRAR TEXTO) ---
function AvatarAutor({ uid, fallbackEmoji, tamanho = '40px' }) {
  const [fotoUrl, setFotoUrl] = useState(null)

  useEffect(() => {
    if (!uid) return
    const carregarFoto = async () => {
      const userDoc = await getDoc(doc(db, "usuarios", uid))
      if (userDoc.exists()) {
        setFotoUrl(userDoc.data().foto)
      }
    }
    carregarFoto()
  }, [uid])

  // Checa se é um link (Google ou Base64) para não renderizar como texto
  const ehLink = (str) => typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:image'));
  const imagemParaExibir = fotoUrl || (ehLink(fallbackEmoji) ? fallbackEmoji : null);

  return (
    <div style={{ 
      width: tamanho, height: tamanho, borderRadius: '50%', 
      overflow: 'hidden', background: '#eee', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd'
    }}>
      {imagemParaExibir ? (
        <img 
          src={imagemParaExibir} 
          alt="" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
        />
      ) : (
        <span style={{ fontSize: parseInt(tamanho) * 0.6 + 'px' }}>
          {fallbackEmoji && !ehLink(fallbackEmoji) ? fallbackEmoji : '👤'}
        </span>
      )}
    </div>
  )
}

function Feed({ usuario }) {
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [focado, setFocado] = useState(false)
  const [eiEnviados, setEiEnviados] = useState([])
  const [postParaExcluir, setPostParaExcluir] = useState(null)
  const [editandoId, setEditandoId] = useState(null)
  const [textoEditado, setTextoEditado] = useState('')
  const [minhaFotoAtual, setMinhaFotoAtual] = useState('')

  // Monitora sua própria foto para a área de postagem
  useEffect(() => {
    if (!usuario?.uid) return
    const unsub = onSnapshot(doc(db, "usuarios", usuario.uid), (docSnap) => {
      if (docSnap.exists()) setMinhaFotoAtual(docSnap.data().foto)
    })
    return () => unsub()
  }, [usuario])

  // Carrega os posts
  useEffect(() => {
    const q = query(collection(db, "posts"), orderBy("data", "desc"))
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub()
  }, [])

  async function publicar() {
    if (novoPost.trim() === '') return
    try {
      await addDoc(collection(db, "posts"), {
        autorUid: usuario?.uid,
        usuario: usuario?.displayName || 'Você',
        avatar: minhaFotoAtual || usuario?.photoURL || '🧑',
        texto: novoPost,
        curtidas: 0,
        curtidores: [], 
        data: serverTimestamp()
      })
      setNovoPost('')
    } catch (e) { console.error(e) }
  }

  async function curtir(post) {
    if (!usuario?.uid) return
    const postRef = doc(db, "posts", post.id)
    const jaCurtiu = post.curtidores?.includes(usuario.uid)
    try {
      await updateDoc(postRef, {
        curtidas: increment(jaCurtiu ? -1 : 1),
        curtidores: jaCurtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
      })
    } catch (e) { console.error(e) }
  }

  async function salvarEdicao(postId) {
    if (textoEditado.trim() === '') return
    try {
      await updateDoc(doc(db, "posts", postId), { texto: textoEditado })
      setEditandoId(null)
    } catch (e) { console.error(e) }
  }

  async function confirmarExclusao() {
    if (!postParaExcluir) return
    try {
      await deleteDoc(doc(db, "posts", postParaExcluir))
      setPostParaExcluir(null)
    } catch (e) { console.error(e) }
  }

  function mandarEi(postId, nomeUsuario) {
    if (eiEnviados.includes(postId)) return 
    setEiEnviados([...eiEnviados, postId])
    if (Notification.permission === "granted") {
      new Notification("👋 Ei!", { body: `Você mandou um "Ei!" para ${nomeUsuario}` });
    } else {
      alert(`👋 Ei mandado para ${nomeUsuario}!`);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '80px' }}>
      
      {postParaExcluir && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ color: '#002776' }}>Excluir Postagem?</h3>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '20px' }}>
              <button onClick={() => setPostParaExcluir(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarExclusao} style={btnDeleteConfirm}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* ÁREA DE POSTAR */}
        <div style={cardEstilo}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ width: '45px', height: '45px', borderRadius: '50%', overflow: 'hidden', background: '#eee' }}>
                {(minhaFotoAtual || usuario?.photoURL) ? (
                    <img src={minhaFotoAtual || usuario?.photoURL} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="" />
                ) : <span style={{fontSize: '36px'}}>🧑</span>}
            </div>
            <textarea
              placeholder="No que você está pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={{...textareaEstilo, border: focado ? '2px solid #009c3b' : '1px solid #ddd'}}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'end', marginTop: '12px' }}>
            <button onClick={publicar} style={btnPublicar(novoPost.trim() === '')}>Publicar</button>
          </div>
        </div>

        {/* LISTA DE POSTS */}
        {posts.map((post) => {
          const souEu = post.autorUid === usuario?.uid
          const postCurtidoPorMim = post.curtidores?.includes(usuario?.uid)
          const isEditando = editandoId === post.id
          const eiJaEnviado = eiEnviados.includes(post.id)

          return (
            <div key={post.id} style={{...cardEstilo, position: 'relative' }}>
              
              {souEu && !isEditando && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                  <span onClick={() => { setEditandoId(post.id); setTextoEditado(post.texto); }} style={iconBtn}>✏️</span>
                  <span onClick={() => setPostParaExcluir(post.id)} style={iconBtn}>🗑️</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <AvatarAutor uid={post.autorUid} fallbackEmoji={post.avatar} />
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px', margin: 0 }}>{post.usuario}</p>
                  <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>{post.data?.toDate ? post.data.toDate().toLocaleTimeString() : 'agora'}</p>
                </div>
              </div>

              {isEditando ? (
                <div>
                  <textarea value={textoEditado} onChange={(e) => setTextoEditado(e.target.value)} style={textareaEstilo} />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'end' }}>
                    <button onClick={() => setEditandoId(null)} style={btnCancel}>Cancelar</button>
                    <button onClick={() => salvarEdicao(post.id)} style={btnSave}>Salvar</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '16px', color: '#333', whiteSpace: 'pre-wrap' }}>{post.texto}</p>
              )}
              
              <div style={barraAcoes}>
                <button onClick={() => curtir(post)} style={{...btnAcao, color: postCurtidoPorMim ? '#e00' : '#555'}}>
                  {postCurtidoPorMim ? '❤️' : '🤍'} {post.curtidas || 0}
                </button>
                <button style={btnAcao}>💬 Comentar</button>
                {!souEu && (
                  <button onClick={() => mandarEi(post.id, post.usuario)} style={{...btnAcao, color: eiJaEnviado ? '#ffaa00' : '#555'}}>
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

// --- ESTILOS ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '90%', maxWidth: '320px' };
const btnDeleteConfirm = { background: '#ff3b30', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { background: '#eee', color: '#555', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnSave = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const cardEstilo = { background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const textareaEstilo = { flex: 1, padding: '12px', borderRadius: '12px', fontSize: '15px', outline: 'none', background: 'white', resize: 'none', width: '100%', boxSizing: 'border-box', minHeight: '60px' };
const btnPublicar = (vazio) => ({ padding: '8px 24px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', cursor: vazio ? 'not-allowed' : 'pointer', background: vazio ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)' });
const barraAcoes = { display: 'flex', gap: '12px', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '12px' };
const btnAcao = { border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold', padding: '6px 12px' };
const iconBtn = { cursor: 'pointer', opacity: 0.5, fontSize: '16px' };

export default Feed;