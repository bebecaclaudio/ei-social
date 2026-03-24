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

  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth)
  const [abaAtiva, setAbaAtiva] = useState('feed') 
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
      autorFoto: usuario.photoURL || "", // Garante que a foto do usuário atual vá para o post
      texto: novoPost,
      data: serverTimestamp()
    })
    setNovoPost('')
  }

  if (carregando) return <div style={msgAviso}>Carregando...</div>
  if (!comu) return <div style={msgAviso}>Comunidade não encontrada.</div>

  const eDono = comu.criadoPor === usuario?.uid
  // Simulação de membros para lógica do "Ver todos"
  const membrosExibir = posts.slice(0, 8); 

  return (
    <div style={containerPrincipal}>
      
      <div style={bannerHero(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBanner(isMobile)}>
           {comu.emoji || '👥'}
        </div>
      </div>

      {isMobile && (
        <div style={tabContainer}>
          <button onClick={() => setAbaAtiva('feed')} style={abaAtiva === 'feed' ? tabAtiva : tabInativa}>Feed</button>
          <button onClick={() => setAbaAtiva('sobre')} style={abaAtiva === 'sobre' ? tabAtiva : tabInativa}>Sobre</button>
        </div>
      )}

      <div style={layoutGrid(isMobile)}>
        
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              {/* CORREÇÃO DE CONTRASTE: Título em cinza muito escuro para legibilidade */}
              <h2 style={{ margin: '0 0 10px 0', color: '#1a1a1a', textAlign: 'center' }}>{comu.nome}</h2>
              <div style={{ textAlign: 'center' }}><span style={badgeStyle}>{comu.categoria}</span></div>
              <p style={descricaoTexto}>{comu.descricao || "Bem-vindos!"}</p>
              {eDono && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciar}>⚙️ Gerenciar</button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          {abaAtiva === 'feed' ? (
            <>
              <div style={cardStyle}>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {/* CORREÇÃO: Foto do avatar no campo de postagem */}
                  <img src={usuario?.photoURL || 'https://via.placeholder.com/40'} style={avatarStyle} alt="Sua foto" />
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
                    {/* CORREÇÃO: Foto do autor no card do post */}
                    <img src={p.autorFoto || 'https://via.placeholder.com/40'} style={avatarStyle} alt="" />
                    <div>
                      <strong style={{ display: 'block', color: '#333' }}>{p.autorNome}</strong>
                      <small style={{ color: '#999' }}>{p.data?.toDate()?.toLocaleString()}</small>
                    </div>
                  </div>
                  <p style={{ marginTop: '15px', whiteSpace: 'pre-wrap', color: '#444' }}>{p.texto}</p>
                </div>
              ))}
            </>
          ) : (
            <div style={cardStyle}>
              <h2 style={{ color: '#1a1a1a' }}>{comu.nome}</h2>
              <p style={descricaoTexto}>{comu.descricao}</p>
            </div>
          )}
        </main>

        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4 style={{ marginBottom: '15px', color: '#333' }}>Membros ({comu.membrosCount || 0})</h4>
              <div style={gridMembros}>
                 {membrosExibir.map((m, index) => (
                   <div key={index} style={rostinhoPlaceholder}>
                      <img src={m.autorFoto || 'https://via.placeholder.com/40'} style={imgFull} alt="Membro" />
                   </div>
                 ))}
              </div>
              {/* LÓGICA VER TODOS: Aparece se houver muitos membros */}
              {posts.length > 8 && (
                <button 
                  onClick={() => navigate(`/comunidades/${id}/membros`)} 
                  style={btnVerTodos}
                >
                  Ver todos os membros
                </button>
              )}
            </div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS COM CORREÇÕES DE CONTRASTE E LAYOUT ---
const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };

const bannerHero = (capa, isMobile) => ({
  width: '100%',
  height: isMobile ? '140px' : '280px',
  background: capa?.startsWith('http') ? `url(${capa}) center/cover no-repeat` : capa,
  borderRadius: isMobile ? '0' : '0 0 20px 20px',
  position: 'relative'
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

const layoutGrid = (isMobile) => ({
  display: 'flex',
  gap: '20px',
  marginTop: isMobile ? '45px' : '25px',
  paddingBottom: '60px'
});

const cardStyle = { background: 'white', padding: '20px', borderRadius: '15px', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' };
const badgeStyle = { background: '#f0f4ff', padding: '5px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold', color: '#002776', display: 'inline-block' };
const descricaoTexto = { fontSize: '14px', color: '#444', marginTop: '12px', lineHeight: '1.6' };
const btnGerenciar = { width: '100%', marginTop: '15px', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', background: '#fcfcfc', fontWeight: 'bold', cursor: 'pointer' };

const textareaStyle = { 
  flex: 1, 
  minHeight: '90px', 
  border: '1px solid #e0e0e0', 
  borderRadius: '12px', 
  padding: '12px', 
  outline: 'none', 
  resize: 'none',
  boxSizing: 'border-box',
  fontSize: '15px',
  backgroundColor: '#f9f9f9',
  color: '#333' // Contraste no texto digitado
};

const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const avatarStyle = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #eee' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px', marginTop: '10px' };
const rostinhoPlaceholder = { width: '40px', height: '40px', borderRadius: '50%', background: '#eee', overflow: 'hidden' };
const imgFull = { width: '100%', height: '100%', objectFit: 'cover' };

const btnVerTodos = { 
  width: '100%', 
  marginTop: '15px', 
  padding: '8px', 
  background: 'none', 
  border: '1px solid #002776', 
  color: '#002776', 
  borderRadius: '8px', 
  fontSize: '13px', 
  fontWeight: 'bold', 
  cursor: 'pointer' 
};

const tabContainer = { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '40px', borderBottom: '1px solid #eee' };
const tabAtiva = { padding: '12px 20px', border: 'none', background: 'none', borderBottom: '3px solid #002776', fontWeight: 'bold', color: '#002776' };
const tabInativa = { padding: '12px 20px', border: 'none', background: 'none', color: '#999' };
const msgAviso = { padding: '100px', textAlign: 'center' };

export default PaginaComunidade;