import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebase-config'
import { doc, onSnapshot, collection, query, where, orderBy, addDoc, serverTimestamp } from 'firebase/firestore'
import { SidebarEsquerda, SidebarDireita } from './Sidebars'

function PaginaComunidade({ usuario }) {
  const { id } = useParams() 
  const navigate = useNavigate()
  const [comu, setComu] = useState(null)
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [carregando, setCarregando] = useState(true)

  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth)
  const isMobile = larguraJanela < 768

  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    setCarregando(true)
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
      setCarregando(false)
    });
    return () => unsub();
  }, [id]);

  useEffect(() => {
    if (!comu?.id) return;
    const q = query(collection(db, "posts_comunidades"), where("comunidadeId", "==", comu.id), orderBy("data", "desc"))
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
  const fotoPerfil = usuario?.photoURL || 'https://www.w3schools.com/howto/img_avatar.png';

  return (
    <div style={containerPrincipal}>
      <div style={bannerHero(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBanner(isMobile)}>{comu.emoji || '👥'}</div>
      </div>

      <div style={layoutGrid(isMobile)}>
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              <h2 style={tituloComu}>{comu.nome}</h2>
              <div style={{ textAlign: 'center' }}><span style={badgeStyle}>{comu.categoria}</span></div>
              <p style={descricaoTexto}>{comu.descricao || "Bem-vindos!"}</p>
              
              {/* BOTÃO AMARELO COM ALTO CONTRASTE */}
              {eDono && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciarAmarelo}>
                  ⚙️ Gerenciar Comunidade
                </button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <img src={fotoPerfil} style={avatarStyle} alt="Sua Foto" />
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
                <img src={p.autorFoto || fotoPerfil} style={avatarStyle} alt="" />
                <div>
                  <strong style={{ display: 'block', color: '#333' }}>{p.autorNome}</strong>
                  <small style={{ color: '#999' }}>{p.data?.toDate()?.toLocaleString()}</small>
                </div>
              </div>
              <p style={{ marginTop: '15px', color: '#444' }}>{p.texto}</p>
            </div>
          ))}
        </main>

        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4 style={{ marginBottom: '15px' }}>Membros ({comu.membrosCount || 1})</h4>
              <div style={gridMembros}>
                 <div style={rostinhoMembro}><img src={fotoPerfil} style={imgFull} alt="Eu" /></div>
              </div>
            </div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS ---
const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };
const bannerHero = (capa, isMobile) => ({ width: '100%', height: isMobile ? '140px' : '280px', background: capa?.startsWith('http') ? `url(${capa}) center/cover no-repeat` : capa, borderRadius: isMobile ? '0' : '0 0 20px 20px', position: 'relative' });
const iconeBanner = (isMobile) => ({ width: isMobile ? '55px' : '85px', height: isMobile ? '55px' : '85px', background: 'white', borderRadius: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '28px' : '45px', position: 'absolute', bottom: '-25px', left: isMobile ? '50%' : '30px', transform: isMobile ? 'translateX(-50%)' : 'none', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' });
const layoutGrid = (isMobile) => ({ display: 'flex', gap: '20px', marginTop: isMobile ? '45px' : '25px', paddingBottom: '60px' });
const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const tituloComu = { margin: '0 0 10px 0', color: '#1a1a1a', textAlign: 'center' };
const badgeStyle = { background: '#f0f4ff', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: '#002776', display: 'inline-block' };
const descricaoTexto = { fontSize: '14px', color: '#444', marginTop: '12px', textAlign: 'center' };

const btnGerenciarAmarelo = { 
  width: '100%', marginTop: '15px', padding: '12px', borderRadius: '10px', border: '2px solid #CCAC00', 
  background: '#FFD700', color: '#000', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #CCAC00' 
};

const textareaStyle = { flex: 1, minHeight: '90px', border: '1px solid #e0e0e0', borderRadius: '12px', padding: '12px', outline: 'none', resize: 'none', boxSizing: 'border-box', backgroundColor: '#f9f9f9' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const avatarStyle = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' };
const rostinhoMembro = { width: '42px', height: '42px', borderRadius: '50%', background: '#eee', overflow: 'hidden', border: '2px solid #002776' };
const imgFull = { width: '100%', height: '100%', objectFit: 'cover' };
const msgAviso = { padding: '100px', textAlign: 'center' };

export default PaginaComunidade;