import { useState, useEffect } from 'react'
import { db } from './firebase-config' 
import { 
  collection, addDoc, onSnapshot, query, 
  orderBy, serverTimestamp, doc, updateDoc, increment, arrayUnion, arrayRemove,
  deleteDoc 
} from 'firebase/firestore'

function Feed({ usuario }) {
  // --- ESTADOS (Onde guardamos as informações da tela) ---
  const [posts, setPosts] = useState([]) // Guarda a lista de postagens do banco
  const [novoPost, setNovoPost] = useState('') // Texto que você está digitando para postar
  const [focado, setFocado] = useState(false) // Controla se o mouse está dentro do campo de texto
  const [toast, setToast] = useState(null) // Mensagem de aviso que aparece e some no topo
  
  // --- CONTROLES DE EDIÇÃO E EXCLUSÃO ---
  const [postParaExcluir, setPostParaExcluir] = useState(null) // Guarda o ID do post que vai ser deletado (abre o modal)
  const [editandoId, setEditandoId] = useState(null) // Guarda o ID do post que você clicou para editar
  const [textoEditado, setTextoEditado] = useState('') // Guarda o novo texto enquanto você edita

  // --- BUSCA TEMPO REAL (Ouvindo o Firebase) ---
  useEffect(() => {
    // Cria uma consulta ordenada pela data (mais recentes primeiro)
    const q = query(collection(db, "posts"), orderBy("data", "desc"))
    // Fica "vigiando" o banco: se alguém postar ou curtir, a tela atualiza sozinha
    const unsub = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })))
    })
    return () => unsub() // Limpa a vigilância ao sair da tela
  }, [])

  // --- FUNÇÃO: PUBLICAR NOVA POSTAGEM ---
  async function publicar() {
    if (novoPost.trim() === '') return // Não deixa postar vazio
    try {
      await addDoc(collection(db, "posts"), {
        autorUid: usuario?.uid, // ID único do Google para saber quem postou
        usuario: usuario?.displayName || 'Você',
        avatar: usuario?.photoURL || '🧑',
        texto: novoPost,
        curtidas: 0,
        curtidores: [], // Lista de IDs de quem curtiu (para evitar curtida dupla)
        data: serverTimestamp() // Data oficial do servidor do Firebase
      })
      setNovoPost('') // Limpa o campo após postar
    } catch (e) { console.error("Erro ao publicar:", e) }
  }

  // --- FUNÇÃO: CURTIR / DESCURTIR ---
  async function curtir(post) {
    if (!usuario?.uid) return
    const postRef = doc(db, "posts", post.id)
    const jaCurtiu = post.curtidores?.includes(usuario.uid) // Verifica se o seu ID está na lista
    
    try {
      await updateDoc(postRef, {
        // Se já curtiu, tira 1. Se não, soma 1.
        curtidas: increment(jaCurtiu ? -1 : 1),
        // Se já curtiu, remove seu ID da lista. Se não, adiciona.
        curtidores: jaCurtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
      })
    } catch (e) { console.error("Erro ao curtir:", e) }
  }

  // --- FUNÇÃO: SALVAR EDIÇÃO ---
  async function salvarEdicao(postId) {
    if (textoEditado.trim() === '') return
    try {
      await updateDoc(doc(db, "posts", postId), { texto: textoEditado })
      setEditandoId(null) // Fecha o campo de edição
      setToast('Postagem atualizada!')
      setTimeout(() => setToast(null), 2000)
    } catch (e) { console.error(e) }
  }

  // --- FUNÇÃO: EXCLUIR DEFINITIVAMENTE ---
  async function confirmarExclusao() {
    if (!postParaExcluir) return
    try {
      await deleteDoc(doc(db, "posts", postParaExcluir))
      setPostParaExcluir(null) // Fecha o modal
      setToast('Postagem excluída!')
      setTimeout(() => setToast(null), 2000)
    } catch (e) { console.error(e) }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '80px' }}>
      
      {/* AVISO FLUTUANTE (TOAST) */}
      {toast && <div style={toastStyle}>{toast}</div>}

      {/* MODAL DE CONFIRMAÇÃO (Só aparece se houver um post selecionado para excluir) */}
      {postParaExcluir && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <h3 style={{ color: '#002776' }}>Excluir Postagem?</h3>
            <p style={{ color: '#666', margin: '15px 0' }}>Essa ação não pode ser desfeita.</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
              <button onClick={() => setPostParaExcluir(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarExclusao} style={btnDeleteConfirm}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ maxWidth: '600px', margin: '0 auto', padding: '24px 16px' }}>
        
        {/* ÁREA DE CRIAÇÃO (Card Superior) */}
        <div style={cardEstilo}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <span style={{ fontSize: '36px' }}>🧑</span>
            <textarea
              placeholder="No que você está pensando?"
              value={novoPost}
              onChange={(e) => setNovoPost(e.target.value)}
              onFocus={() => setFocado(true)}
              onBlur={() => setFocado(false)}
              style={{...textareaEstilo, border: focado ? '2px solid #009c3b' : '1px solid #ddd', color: '#333'}}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'end', marginTop: '12px' }}>
            <button onClick={publicar} style={btnPublicar(novoPost.trim() === '')}>Publicar</button>
          </div>
        </div>

        {/* FEED DE POSTAGENS (Loop que desenha cada post) */}
        {posts.map((post) => {
          const souEu = post.autorUid === usuario?.uid // Verifica se você é o dono deste post
          const postCurtidoPorMim = post.curtidores?.includes(usuario?.uid) // Verifica se você já deu like
          const isEditando = editandoId === post.id // Verifica se este post específico está sendo editado

          return (
            <div key={post.id} style={{...cardEstilo, position: 'relative' }}>
              
              {/* BOTÕES DE DONO (Lápis e Lixeira - Só aparecem nos seus posts) */}
              {souEu && !isEditando && (
                <div style={{ position: 'absolute', top: '20px', right: '20px', display: 'flex', gap: '12px' }}>
                  <span title="Editar" onClick={() => { setEditandoId(post.id); setTextoEditado(post.texto); }} style={iconBtn}>✏️</span>
                  <span title="Excluir" onClick={() => setPostParaExcluir(post.id)} style={iconBtn}>🗑️</span>
                </div>
              )}

              {/* CABEÇALHO DO POST (Foto e Nome) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                <span style={{ fontSize: '40px' }}>{post.avatar}</span>
                <div>
                  <p style={{ fontWeight: 'bold', fontSize: '15px' }}>{post.usuario}</p>
                  <p style={{ color: '#888', fontSize: '12px' }}>{post.data?.toDate ? post.data.toDate().toLocaleTimeString() : 'agora'}</p>
                </div>
              </div>

              {/* CORPO DO POST (Mostra o texto OU o campo de edição) */}
              {isEditando ? (
                <div>
                  <textarea 
                    value={textoEditado}
                    onChange={(e) => setTextoEditado(e.target.value)}
                    style={{...textareaEstilo, height: '80px', border: '2px solid #009c3b', color: '#333'}}
                  />
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px', justifyContent: 'end' }}>
                    <button onClick={() => setEditandoId(null)} style={btnCancel}>Cancelar</button>
                    <button onClick={() => salvarEdicao(post.id)} style={btnSave}>Salvar</button>
                  </div>
                </div>
              ) : (
                <p style={{ fontSize: '16px', color: '#333', whiteSpace: 'pre-wrap' }}>{post.texto}</p>
              )}
              
              {/* BARRA DE AÇÕES (Curtir e Comentar) */}
              <div style={barraAcoes}>
                <button 
                  onClick={() => curtir(post)} 
                  style={{
                    ...btnAcao,
                    color: postCurtidoPorMim ? '#e00' : '#555',
                    background: postCurtidoPorMim ? '#fff0f0' : 'none',
                    borderRadius: '20px',
                    padding: '6px 14px'
                  }}
                >
                  {postCurtidoPorMim ? '❤️' : '🤍'} {post.curtidas || 0}
                </button>
                <button style={{...btnAcao, padding: '6px 14px'}}>💬 Comentar</button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// --- ESTILOS CSS-IN-JS (As "roupas" do seu app) ---
const overlayStyle = { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10000, backdropFilter: 'blur(4px)' };
const modalStyle = { background: 'white', padding: '30px', borderRadius: '20px', textAlign: 'center', width: '90%', maxWidth: '320px' };
const btnDeleteConfirm = { background: '#ff3b30', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { background: '#eee', color: '#555', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnSave = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const cardEstilo = { background: 'white', borderRadius: '16px', padding: '20px', marginBottom: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' };
const textareaEstilo = { flex: 1, padding: '12px', borderRadius: '12px', fontSize: '15px', outline: 'none', background: 'white', resize: 'none', width: '100%', boxSizing: 'border-box' };
const btnPublicar = (vazio) => ({ padding: '8px 24px', borderRadius: '10px', border: 'none', color: 'white', fontWeight: 'bold', cursor: vazio ? 'not-allowed' : 'pointer', background: vazio ? '#ccc' : 'linear-gradient(90deg, #002776, #009c3b)' });
const barraAcoes = { display: 'flex', gap: '16px', borderTop: '1px solid #eee', paddingTop: '12px', marginTop: '12px' };
const btnAcao = { border: 'none', background: 'none', cursor: 'pointer', fontWeight: 'bold' };
const iconBtn = { cursor: 'pointer', opacity: 0.5, fontSize: '16px' };
const toastStyle = { position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', background: '#002776', color: 'white', padding: '10px 20px', borderRadius: '20px', zIndex: 999 };

export default Feed;