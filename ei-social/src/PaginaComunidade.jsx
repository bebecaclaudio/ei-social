import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebase-config'
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  addDoc, serverTimestamp, updateDoc, arrayUnion 
} from 'firebase/firestore'
import { SidebarEsquerda, SidebarDireita } from './Sidebars'

function PaginaComunidade({ usuario }) {
  const { id } = useParams() // Agora o 'id' que vem da URL é o slug (ex: monarquistas-brasileiros)
  const navigate = useNavigate()
  const [comu, setComu] = useState(null)
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')

  // 1. MODIFICADO: Monitorar dados da Comunidade usando o SLUG
  useEffect(() => {
    // Criamos uma busca (query) onde o campo 'slug' seja igual ao 'id' da URL
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        // Como o slug é único, pegamos o primeiro resultado [0]
        const docSnap = snapshot.docs[0];
        setComu({ id: docSnap.id, ...docSnap.data() });
      } else {
        // Se não achar nada, talvez seja um ID antigo (código aleatório)
        // Opcional: tentar buscar por doc(db, "comunidades", id) aqui
      }
    });
    return () => unsub();
  }, [id]);

  // 2. MODIFICADO: Monitorar Posts usando o ID REAL (comu.id)
  useEffect(() => {
    if (!comu?.id) return; // Só busca posts quando a comunidade for encontrada

    const q = query(
      collection(db, "posts_comunidades"),
      where("comunidadeId", "==", comu.id), // Importante: usar comu.id e não o slug da URL
      orderBy("data", "desc")
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [comu?.id]); // Monitora a mudança do objeto comu

  // 3. Função para Postar
  async function enviarPost() {
    if (!novoPost.trim() || !comu?.id) return
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id, // ID real do banco
      autorUid: usuario.uid,
      autorNome: usuario.displayName || "Membro",
      autorFoto: usuario.photoURL || "",
      texto: novoPost,
      data: serverTimestamp()
    })
    setNovoPost('')
  }

  if (!comu) return <div style={{padding: '50px', textAlign: 'center'}}>Carregando...</div>

  const eDono = comu.criadoPor === usuario?.uid

  return (
    <div style={layoutGrid}>
      
      {/* COLUNA ESQUERDA: IDENTIDADE */}
      <SidebarEsquerda>
        <div style={cardStyle}>
          <div style={bannerEstilo(comu.corCapa || '#002776')}>
            <span style={{ fontSize: '40px' }}>{comu.emoji || '👥'}</span>
          </div>
          <h2 style={{ margin: '15px 0 5px 0' }}>{comu.nome}</h2>
          <p style={badge}>{comu.categoria}</p>
          <p style={descricaoTexto}>{comu.descricao || "Bem-vindos à nossa comunidade!"}</p>
          
          {eDono && (
            <button 
              onClick={() => navigate(`/comunidades/${id}/gerenciar`)}
              style={btnGerenciar}
            >
              ⚙️ Gerenciar Comunidade
            </button>
          )}
        </div>
      </SidebarEsquerda>

      {/* COLUNA CENTRAL: INTERAÇÕES (FEED) */}
      <main style={{ flex: 1, minWidth: '0' }}>
        <div style={cardStyle}>
          <textarea 
            placeholder={`O que há de novo na ${comu.nome}?`}
            value={novoPost}
            onChange={(e) => setNovoPost(e.target.value)}
            style={textareaEstilo}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
            <button onClick={enviarPost} style={btnPostar}>Postar</button>
          </div>
        </div>

        {posts.length === 0 ? (
          <p style={{textAlign: 'center', color: '#999', marginTop: '20px'}}>Nenhum post ainda. Seja o primeiro!</p>
        ) : (
          posts.map(p => (
            <div key={p.id} style={{ ...cardStyle, marginBottom: '15px', marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img src={p.autorFoto || 'https://via.placeholder.com/40'} style={avatarPost} alt="" />
                <div>
                  <strong style={{ display: 'block' }}>{p.autorNome}</strong>
                  <small style={{ color: '#999' }}>
                    {p.data?.toDate() ? p.data.toDate().toLocaleString() : 'Enviando...'}
                  </small>
                </div>
              </div>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{p.texto}</p>
            </div>
          ))
        )}
      </main>

      {/* COLUNA DIREITA: MEMBROS */}
      <SidebarDireita>
        <div style={cardStyle}>
          <h4 style={{ marginBottom: '15px' }}>Membros ({comu.membrosCount || 0})</h4>
          <div style={gridMembros}>
            {/* Onde os rostinhos aparecerão */}
            <div style={rostinhoPlaceholder}>👤</div>
          </div>
        </div>
      </SidebarDireita>

    </div>
  )
}

// ... (Mantenha seus estilos abaixo como estão)
const layoutGrid = { display: 'flex', gap: '20px', maxWidth: '1200px', margin: '0 auto', padding: '20px' };
const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const bannerEstilo = (cor) => ({ height: '100px', background: cor, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' });
const badge = { background: '#f0f2f5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#002776' };
const descricaoTexto = { fontSize: '14px', color: '#555', marginTop: '10px', lineHeight: '1.5' };
const btnGerenciar = { width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#f9f9f9', fontWeight: 'bold', cursor: 'pointer' };
const textareaEstilo = { width: '100%', minHeight: '80px', border: '1px solid #eee', borderRadius: '10px', padding: '12px', outline: 'none', resize: 'none' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' };
const avatarPost = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' };
const rostinhoPlaceholder = { width: '45px', height: '45px', borderRadius: '50%', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' };

export default PaginaComunidade;