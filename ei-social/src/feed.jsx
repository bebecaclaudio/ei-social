import { useState, useEffect } from 'react'
import { db } from './firebase-config' 
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove,
  deleteDoc 
} from 'firebase/firestore'

function Feed({ usuario }) {
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [focado, setFocado] = useState(false)
  const [eiEnviados, setEiEnviados] = useState([])
  const [toast, setToast] = useState(null)

  // Estados para Edição
  const [editandoId, setEditandoId] = useState(null)
  const [textoEditado, setTextoEditado] = useState('')

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
        avatar: usuario?.photoURL || '🧑',
        texto: novoPost,
        curtidas: 0,
        curtidores: [], 
        data: serverTimestamp()
      })
      setNovoPost('')
    } catch (e) { console.error(e) }
  }

  // --- FUNÇÃO DE SALVAR EDIÇÃO ---
  async function salvarEdicao(postId) {
    if (textoEditado.trim() === '') return
    try {
      const postRef = doc(db, "posts", postId)
      await updateDoc(postRef, { texto: textoEditado })
      setEditandoId(null)
      setToast('Post atualizado!')
      setTimeout(() => setToast(null), 2000)
    } catch (e) { console.error(e) }
  }

  async function excluirPost(postId, autorUid) {
    if (autorUid !== usuario?.uid) return
    if (window.confirm("Excluir esta cutucada pra sempre?")) {
      try {
        await deleteDoc(doc(db, "posts", postId))
        setToast('Excluído!')
        setTimeout(() => setToast(null), 2000)
      } catch (e) { console.error(e) }
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '80px' }}>
      {toast && <div style={toastStyle}>{toast}</div>}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* INPUT DE POSTAGEM */}
        <div style={cardEstilo}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
            <span style={{ fontSize: '36px' }}>🧑</span>
            <textarea
              placeholder="No que voce esta pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={{...textareaEstilo, border: focado ? '2px solid #009c3b' : '2px solid #ddd', color: '#333'}}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'end', marginTop: '12px' }}>
            <button onClick={publicar} style={{
              ...btnPublicar,
              background: novoPost.trim() === '' ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)',
            }}>Publicar</button>
          </div>
        </div>

        {/* LISTA DE POSTS */}
        {posts.map((post) => {
          const souEu = post.autorUid === usuario?.uid
          const isEditando = editandoId === post.id

          return (
            <div key={post.id} style={{...cardEstilo, position: 'relative' }}>
              
              {/* BOTÕES DE AÇÃO (LÁPIS E LIXEIRA) */}
              {souEu && !isEditando && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '10px' }}>
                  <span title="Editar" onClick={() => { setEditandoId(post.id); setTextoEditado(post.texto); }} style={iconBtn}>✏️</span>
                  <span title="Excluir" onClick={() => excluirPost(post.id, post.autorUid)} style={iconBtn}>🗑️</span>
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>{post.avatar}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px', color: '#222' }}>{post.usuario}</p>
                  <p style={{ color: '#888', fontSize: '12px' }}>{post.data?.toDate ? post.data.toDate().toLocaleTimeString() : '...'}</p>
                </div>
              </div>

              {/* CONTEÚDO: TEXTO OU ÁREA DE EDIÇÃO */}
              {isEditando ? (
                <div style={{ marginBottom: '15px' }}>
                  <textarea 
                    value={textoEditado}
                    onChange={(e) => setTextoEditado(e.target.value)}
                    style={{...textareaEstilo, height: '60px', border: '1px solid #009c3b', color: '#333'}}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'end' }}>
                    <button onClick={() => setEditandoId(null)} style={btnCancel}>Cancelar</button>
                    <button onClick={() => salvarEdicao(post.id)} style={btnSave}>Salvar</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '16px', marginBottom: '16px', color: '#333', whiteSpace: 'pre-wrap' }}>{post.texto}</p>
              )}
              
              <div style={barraAcoes}>
                <button style={btnAcao}>❤️ {post.curtidas || 0}</button>
                <button style={btnAcao}>💬 Comentar</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ESTILOS ADICIONAIS
const cardEstilo = { background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const textareaEstilo = { flex: 1, padding: '12px', borderRadius: '12px', fontSize: '15px', outline: 'none', background: 'white', resize: 'none', width: '100%', boxSizing: 'border-box', border: '1px solid #ddd' };
const btnPublicar = { padding: '8px 24px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const barraAcoes = { display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px' };
const btnAcao = { border: 'none', background: 'none', cursor: 'pointer', color: '#555', fontWeight: 'bold' };
const iconBtn = { cursor: 'pointer', opacity: 0.4, transition: '0.2s', fontSize: '16px' };
const btnSave = { background: '#009c3b', color: 'white', border: 'none', padding: '5px 15px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { background: '#eee', color: '#555', border: 'none', padding: '5px 15px', borderRadius: '8px', cursor: 'pointer' };
const toastStyle = { position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#002776', color: 'white', padding: '10px 20px', borderRadius: '20px', zIndex: 999 };

export default Feed;