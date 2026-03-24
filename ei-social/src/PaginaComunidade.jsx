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

  // --- LÓGICA DE RESPONSIVIDADE E ABAS ---
  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth)
  const [abaAtiva, setAbaAtiva] = useState('feed') // 'feed' ou 'sobre'
  const isMobile = larguraJanela < 768

  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // 1. BUSCAR DADOS DA COMUNIDADE (Pelo Slug ou ID)
  useEffect(() => {
    setCarregando(true)
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
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

  // 2. BUSCAR POSTS DA COMUNIDADE
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
    try {
      await addDoc(collection(db, "posts_comunidades"), {
        comunidadeId: comu.id,
        autorUid: usuario.uid,
        autorNome: usuario.displayName || "Membro",
        autorFoto: usuario.photoURL || "",
        texto: novoPost,
        data: serverTimestamp()
      })
      setNovoPost('')
    } catch (e) {
      console.error("Erro ao postar:", e);
    }
  }

  if (carregando) return <div style={msgAviso}>Carregando Pleiadians...</div>
  if (!comu) return <div style={msgAviso}>Comunidade não encontrada.</div>

  const eDono = comu.criadoPor === usuario?.uid

  return (
    <div style={containerPrincipal}>
      
      {/* BANNER HERO DINÂMICO (1200x400) */}
      <div style={bannerHeroStyle(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBannerWrapper(isMobile)}>
           {comu.emoji || '👥'}
        </div>
      </div>

      {/* ABAS EXCLUSIVAS PARA MOBILE */}
      {isMobile && (
        <div style={tabContainer}>
          <button 
            onClick={() => setAbaAtiva('feed')} 
            style={abaAtiva === 'feed' ? tabAtiva : tabInativa}
          >Feed</button>
          <button 
            onClick={() => setAbaAtiva('sobre')} 
            style={abaAtiva === 'sobre' ? tabAtiva : tabInativa}
          >Sobre / Regras</button>
        </div>
      )}

      <div style={layoutGrid(isMobile)}>
        
        {/* SIDEBAR ESQUERDA (Oculta no Mobile) */}
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              <h2 style={{ margin: '0 0 10px 0' }}>{comu.nome}</h2>
              <span style={badgeStyle}>{comu.categoria}</span>
              <p style={descricaoTexto}>{comu.descricao || "Bem-vindos!"}</p>
              {eDono && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciar}>
                  ⚙️ Gerenciar
                </button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        {/* ÁREA CENTRAL */}
        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          
          {abaAtiva === 'feed' ? (
            <>
              {/* CAMPO DE NOVA POSTAGEM */}
              <div style={cardStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <img src={usuario?.photoURL || 'https://via.placeholder.com/40'} style={avatarStyle} alt="" />
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

              {/* LISTAGEM DE POSTS */}
              {posts.map(p => (
                <div key={p.id} style={{ ...cardStyle, marginTop: '15px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <img src={p.autorFoto || 'https://via.placeholder.com/40'} style={avatarStyle} alt="" />
                    <div>
                      <strong style={{ display: 'block', color: '#333' }}>{p.autorNome}</strong>
                      <small style={{ color: '#999' }}>{p.data?.toDate()?.toLocaleString()}</small>
                    </div>
                  </div>
                  <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap', color: '#444', lineHeight: '1.5' }}>{p.texto}</p>
                </div>
              ))}
            </>
          ) : (
            /* CONTEÚDO DA ABA SOBRE (MOBILE) */
            <div style={cardStyle}>
              <h2 style={{ color: '#002776' }}>{comu.nome}</h2>
              <span style={badgeStyle}>{comu.categoria}</span>
              <h3 style={{ marginTop: '25px' }}>📜 Políticas da Comunidade</h3>
              <p style={descricaoTexto}>{comu.descricao || "Siga as regras de convivência."}</p>
              <hr style={{ margin: '20px 0', border: '0.5px solid #eee' }} />
              <h4>Membros ({comu.membrosCount || 0})</h4>
              <p style={{color: '#999', fontSize: '13px'}}>Lista de membros em breve...</p>
            </div>
          )}
        </main>

        {/* SIDEBAR DIREITA (Oculta no Mobile) */}
        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4 style={{ marginBottom: '15px' }}>Membros ({comu.membrosCount || 0})</h4>
              <div style={gridMembros}>
                 <div style={rostinhoPlaceholder}>
                    <img src={usuario?.photoURL} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="" />
                 </div>
              </div>
            </div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- OBJETOS DE ESTILO (CSS-IN-JS) ---

const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };

const bannerHeroStyle = (capa, isMobile) => ({
  width: '100%',
  height: isMobile ? '140px' : '280px',
  background: capa?.startsWith('http') ? `url(${capa}) center/cover no-repeat` : capa,
  borderRadius: isMobile ? '0' : '0 0 20px 20px',
  position: 'relative',
  transition: 'all 0.3s ease'
});

const iconeBannerWrapper = (isMobile) => ({
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
  boxShadow: '0 5px 15px rgba(0,0,0,0.15)',
  zIndex: 10
});

const layoutGrid = (isMobile) => ({
  display: 'flex',
  gap: '20px',
  marginTop: isMobile ? '45px' : '25px',
  paddingBottom: '60px'
});

const tabContainer = { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '40px', borderBottom: '1px solid #eee' };
const tabAtiva = { padding: '12px 20px', border: 'none', background: 'none', borderBottom: '3px solid #002776', fontWeight: 'bold', color: '#002776' };
const tabInativa = { padding: '12px 20px', border: 'none', background: 'none', color: '#999' };

const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const badgeStyle = { background: '#f0f4ff', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: '#002776', display: 'inline-block' };
const descricaoTexto = { fontSize: '14px', color: '#555', marginTop: '12px', lineHeight: '1.6' };
const btnGerenciar = { width: '100%', marginTop: '18px', padding: '12px', borderRadius: '10px', border: '1px solid #eee', background: '#fcfcfc', fontWeight: 'bold', cursor: 'pointer' };

const textareaStyle = { 
  flex: 1, 
  minHeight: '90px', 
  border: '1px solid #f0f0f0', 
  borderRadius: '12px', 
  padding: '12px', 
  outline: 'none', 
  resize: 'none',
  boxSizing: 'border-box', // Crucial para não vazar no mobile
  fontSize: '15px'
};

const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const avatarStyle = { width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' };
const rostinhoPlaceholder = { width: '42px', height: '42px', borderRadius: '50%', background: '#f5f5f5', overflow: 'hidden' };
const msgAviso = { padding: '100px', textAlign: 'center', color: '#aaa', fontSize: '18px' };

export default PaginaComunidade;