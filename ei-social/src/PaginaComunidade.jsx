import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebase-config'
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  addDoc, serverTimestamp 
} from 'firebase/firestore'
import { SidebarEsquerda, SidebarDireita } from './Sidebars'

function PaginaComunidade({ usuario }) {
  const { id } = useParams() 
  const navigate = useNavigate()
  const [comu, setComu] = useState(null)
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [carregando, setCarregando] = useState(true)

  // --- LÓGICA DE RESPONSIVIDADE EM TEMPO REAL ---
  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth)
  const isMobile = larguraJanela < 768

  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 1. BUSCAR COMUNIDADE
  useEffect(() => {
    setCarregando(true)
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        setComu({ id: docSnap.id, ...docSnap.data() });
        setCarregando(false)
      } else {
        const docRef = doc(db, "comunidades", id);
        onSnapshot(docRef, (d) => {
          if (d.exists()) setComu({ id: d.id, ...d.data() });
          setCarregando(false)
        });
      }
    });
    return () => unsub();
  }, [id]);

  // 2. BUSCAR POSTS
  useEffect(() => {
    if (!comu?.id) return;
    const q = query(
      collection(db, "posts_comunidades"),
      where("comunidadeId", "==", comu.id),
      orderBy("data", "desc")
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    });
    return () => unsub()
  }, [comu?.id]);

  async function enviarPost() {
    if (!novoPost.trim() || !comu?.id || !usuario?.uid) return
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id,
      autorUid: usuario.uid,
      autorNome: usuario.displayName || "Membro",
      autorFoto: usuario.photoURL || "",
      texto: novoPost,
      data: serverTimestamp()
    })
    setNovoPost('')
  }

  if (carregando) return <div style={msgAviso}>Carregando...</div>
  if (!comu) return <div style={msgAviso}>Comunidade não encontrada.</div>

  const eDono = comu.criadoPor === usuario?.uid

  return (
    <div style={containerPrincipal}>
      
      {/* BANNER 1200x400 (Responsivo) */}
      <div style={bannerHero(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBanner(isMobile)}>
           {comu.emoji || '👥'}
        </div>
      </div>

      <div style={layoutGrid(isMobile)}>
        
        {/* Sidebar Esquerda (No mobile ela pode ir para o topo ou sumir) */}
        <SidebarEsquerda>
          <div style={cardStyle}>
            <h2 style={{ margin: '0', fontSize: isMobile ? '1.2rem' : '1.5rem' }}>{comu.nome}</h2>
            <p style={badge}>{comu.categoria}</p>
            <p style={descricaoTexto}>{comu.descricao || "Bem-vindos!"}</p>
            {eDono && (
              <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciar}>
                ⚙️ Gerenciar
              </button>
            )}
          </div>
        </SidebarEsquerda>

        {/* FEED CENTRAL */}
        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <img src={usuario?.photoURL || 'https://via.placeholder.com/40'} style={avatar} alt="" />
              <textarea 
                placeholder="O que vamos criar hoje?"
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={textareaEstilo}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={enviarPost} style={btnPostar}>Postar</button>
            </div>
          </div>

          {posts.map(p => (
            <div key={p.id} style={{ ...cardStyle, marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img src={p.autorFoto || 'https://via.placeholder.com/40'} style={avatar} alt="" />
                <div>
                  <strong style={{ display: 'block' }}>{p.autorNome}</strong>
                  <small style={{ color: '#999' }}>{p.data?.toDate()?.toLocaleString()}</small>
                </div>
              </div>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap' }}>{p.texto}</p>
            </div>
          ))}
        </main>

        {/* Sidebar Direita (Escondida no mobile para limpar o visual) */}
        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4>Membros ({comu.membrosCount || 0})</h4>
              <div style={gridMembros}>
                 <div style={rostinho}><img src={usuario?.photoURL} style={imgFull} alt="" /></div>
              </div>
            </div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS RESPONSIVOS ---
const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };

const bannerHero = (capa, isMobile) => ({
  width: '100%',
  height: isMobile ? '150px' : '250px',
  background: capa?.startsWith('http') ? `url(${capa}) center/cover no-repeat` : capa,
  borderRadius: '0 0 20px 20px',
  position: 'relative',
  transition: 'height 0.3s ease'
});

const iconeBanner = (isMobile) => ({
  width: isMobile ? '50px' : '70px',
  height: isMobile ? '50px' : '70px',
  background: 'white',
  borderRadius: '15px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: isMobile ? '24px' : '36px',
  position: 'absolute',
  bottom: '-25px',
  left: '20px',
  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
});

const layoutGrid = (isMobile) => ({
  display: 'flex',
  flexDirection: isMobile ? 'column' : 'row',
  gap: '20px',
  marginTop: '40px',
  paddingBottom: '50px'
});

const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' };
const badge = { background: '#f0f2f5', padding: '4px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: 'bold', color: '#002776', display: 'inline-block', marginTop: '5px' };
const descricaoTexto = { fontSize: '14px', color: '#666', marginTop: '10px' };
const btnGerenciar = { width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#f9f9f9', cursor: 'pointer' };
const textareaEstilo = { flex: 1, border: '1px solid #eee', borderRadius: '10px', padding: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '8px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' };
const avatar = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', marginTop: '10px' };
const rostinho = { width: '40px', height: '40px', borderRadius: '50%', background: '#eee', overflow: 'hidden' };
const imgFull = { width: '100%', height: '100%', objectFit: 'cover' };
const msgAviso = { padding: '50px', textAlign: 'center', color: '#666' };

export default PaginaComunidade;