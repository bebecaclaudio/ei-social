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

  // 1. BUSCAR DADOS DA COMUNIDADE
  useEffect(() => {
    setCarregando(true)
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        const docRef = doc(db, "comunidades", id);
        onSnapshot(docRef, (d) => {
          if (d.exists()) setComu({ id: d.id, ...d.data() });
        });
      }
      setCarregando(false)
    });
    return () => unsub();
  }, [id]);

  // 2. BUSCAR POSTS (Sempre usando o ID real do documento)
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
      // --- CORREÇÃO IMPORTANTE 1: Garante que a foto do usuário seja salva no post ---
      autorFoto: usuario.photoURL || "", 
      texto: novoPost,
      data: serverTimestamp()
    })
    setNovoPost('')
  }

  if (carregando) return <div style={msgAviso}>Carregando Pleiadians...</div>
  if (!comu) return <div style={msgAviso}>Comunidade não encontrada.</div>

  const eDono = comu.criadoPor === usuario?.uid

  // Definimos a foto padrão uma vez para usar em todos os lugares
  const avatarFallback = 'https://www.w3schools.com/howto/img_avatar.png';

  return (
    <div style={containerPrincipal}>
      
      {/* BANNER 1200x400 (Responsivo) */}
      <div style={bannerHero(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBanner(isMobile)}>
           {comu.emoji || '👥'}
        </div>
      </div>

      <div style={layoutGrid(isMobile)}>
        
        {/* Sidebar Esquerda (Escondida no mobile) */}
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              {/* CORREÇÃO DE CONTRASTE: Título em cinza escuro para legibilidade */}
              <h2 style={{ margin: '0 0 10px 0', color: '#1a1a1a', textAlign: 'center' }}>{comu.nome}</h2>
              <div style={{ textAlign: 'center' }}><span style={badgeStyle}>{comu.categoria}</span></div>
              <p style={descricaoTexto}>{comu.descricao || "Bem-vindos!"}</p>
              {eDono && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciar}>
                  ⚙️ Gerenciar
                </button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        {/* FEED CENTRAL */}
        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '10px' }}>
              {/* --- CORREÇÃO IMPORTANTE 2: Usa a foto do usuário logado no campo de postagem --- */}
              <img 
                src={usuario?.photoURL || avatarFallback} 
                style={avatarStyle} 
                alt="Sua foto" 
                onError={(e) => { e.target.src = avatarFallback }} // Fallback se o link do Google falhar
              />
              <textarea 
                placeholder={`O que há de novo na ${comu.nome}?`}
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={enviarPost} style={btnPostar}>Postar</button>
            </div>
          </div>

          {posts.map(p => (
            <div key={p.id} style={{ ...cardStyle, marginTop: '15px' }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <img 
                  src={p.autorFoto || avatarFallback} 
                  style={avatarStyle} 
                  alt="" 
                  onError={(e) => { e.target.src = avatarFallback }} 
                />
                <div>
                  <strong style={{ display: 'block', color: '#333' }}>{p.autorNome}</strong>
                  <small style={{ color: '#999' }}>{p.data?.toDate()?.toLocaleString()}</small>
                </div>
              </div>
              <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap', color: '#444', lineHeight: '1.5' }}>{p.texto}</p>
            </div>
          ))}
        </main>

        {/* Sidebar Direita (Membros) */}
        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Membros ({comu.membrosCount || 1})</h4>
              <div style={gridMembros}>
                 {/* --- CORREÇÃO IMPORTANTE 3: Usa a sua foto na lista de membros --- */}
                 <div style={rostinhoPlaceholder}>
                    <img 
                      src={usuario?.photoURL || avatarFallback} 
                      style={imgFull} 
                      alt="Eu" 
                      onError={(e) => { e.target.src = avatarFallback }}
                    />
                 </div>
              </div>
            </div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS CONSOLIDADOS ---
const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };

const bannerHero = (capa, isMobile) => ({
  width: '100%',
  height: isMobile ? '140px' : '280px',
  background: capa?.startsWith('http') ? `url(${capa}) center/cover no-repeat` : capa,
  borderRadius: isMobile ? '0' : '0 0 20px 20px',
  position: 'relative',
  transition: 'height 0.3s ease'
});

const iconeBanner = (isMobile) => ({
  width: isMobile ? '55px' : '85px',
  height: isMobile ? '55px' : '85px',
  background: 'white',
  borderRadius: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontSize: isMobile ? '28px' : '45px',
  position: 'absolute',
  bottom: '-25px',
  left: isMobile ? '50%' : '30px',
  transform: isMobile ? 'translateX(-50%)' : 'none',
  boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
});

const layoutGrid = (isMobile) => ({ display: 'flex', gap: '20px', marginTop: isMobile ? '45px' : '25px', paddingBottom: '60px' });
const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const badgeStyle = { background: '#f0f4ff', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: '#002776', display: 'inline-block' };
const descricaoTexto = { fontSize: '14px', color: '#666', marginTop: '12px', textAlign: 'center', lineHeight: '1.4' };
const btnGerenciar = { width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fcfcfc', fontWeight: 'bold', cursor: 'pointer' };
const textareaStyle = { flex: 1, border: '1px solid #e0e0e0', borderRadius: '12px', padding: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box', backgroundColor: '#f9f9f9', color: '#333' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const avatarStyle = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #eee' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' };
const rostinhoPlaceholder = { width: '42px', height: '42px', borderRadius: '50%', background: '#eee', overflow: 'hidden' };
const imgFull = { width: '100%', height: '100%', objectFit: 'cover' };
const msgAviso = { padding: '100px', textAlign: 'center', color: '#999' };

export default PaginaComunidade;