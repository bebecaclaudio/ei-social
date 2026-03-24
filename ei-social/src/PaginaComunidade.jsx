import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from './firebase-config'
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  addDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore'
import { SidebarEsquerda, SidebarDireita } from './Sidebars'

// --- AVATAR COM SINCRO EM TEMPO REAL ---
function AvatarAutor({ uid, fallbackFoto, tamanho = '42px' }) {
  const [fotoUrl, setFotoUrl] = useState(null)
  useEffect(() => {
    if (!uid) return
    return onSnapshot(doc(db, "usuarios", uid), (d) => {
      if (d.exists()) setFotoUrl(d.data().foto)
    })
  }, [uid])

  return (
    <div style={{ width: tamanho, height: tamanho, borderRadius: '50%', overflow: 'hidden', background: '#f0f0f0', flexShrink: 0, border: '1px solid #eee' }}>
      <img src={fotoUrl || fallbackFoto || 'https://via.placeholder.com/40'} style={{width:'100%', height:'100%', objectFit:'cover'}} alt="" />
    </div>
  )
}

function PaginaComunidade({ usuario }) {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  const [comu, setComu] = useState(null)
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('feed') 
  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth)
  
  const isMobile = larguraJanela < 768

  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const q = query(collection(db, "comunidades"), where("slug", "==", id))
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
    })
  }, [id])

  useEffect(() => {
    if (!comu?.id) return
    const q = query(collection(db, "posts_comunidades"), where("comunidadeId", "==", comu.id), orderBy("data", "desc"))
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [comu?.id])

  const eAutor = comu?.criadoPor === usuario?.uid

  async function enviarPost() {
    if (!novoPost.trim() || !comu?.id || !usuario?.uid || enviando) return
    setEnviando(true)
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id,
      autorUid: usuario.uid,
      autorNome: usuario.displayName || "Membro",
      autorFoto: usuario.foto || usuario.photoURL || "",
      texto: novoPost,
      data: serverTimestamp(),
      curtidas: [],
      reposts: [],
      comentariosCount: 0
    })
    setNovoPost('')
    setEnviando(false)
  }

  if (!comu) return <div style={msgAviso}>Conectando à rede...</div>

  return (
    <div style={containerPrincipal}>
      {/* HEADER DINÂMICO */}
      <div style={bannerHeroStyle(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBannerWrapper(isMobile)}>{comu.emoji || '✨'}</div>
      </div>

      {/* NAVEGAÇÃO MOBILE (3 ABAS) */}
      {isMobile && (
        <div style={tabContainer}>
          <button onClick={() => setAbaAtiva('feed')} style={abaAtiva === 'feed' ? tabAtiva : tabInativa}>Feed</button>
          <button onClick={() => setAbaAtiva('sobre')} style={abaAtiva === 'sobre' ? tabAtiva : tabInativa}>Sobre</button>
          {eAutor && (
            <button onClick={() => setAbaAtiva('gestao')} style={abaAtiva === 'gestao' ? tabAtivaGestao : tabInativa}>Gestão ⚙️</button>
          )}
        </div>
      )}

      <div style={layoutGrid(isMobile)}>
        
        {/* COLUNA 1: SIDEBAR ESQUERDA (Desktop) */}
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              <h2 style={sTitle}>{comu.nome}</h2>
              <span style={badgeStyle}>{comu.categoria}</span>
              <p style={descricaoTexto}>{comu.descricao}</p>
              {eAutor && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAdmin}>Painel do Criador</button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        {/* COLUNA 2: CONTEÚDO PRINCIPAL */}
        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          
          {/* FEED */}
          {(abaAtiva === 'feed' || !isMobile) && (
            <>
              <div style={cardPostar}>
                <AvatarAutor uid={usuario?.uid} fallbackFoto={usuario?.photoURL} />
                <div style={{flex: 1}}>
                  <textarea 
                    placeholder="Partilhe um fragmento de ideia..."
                    value={novoPost} onChange={(e) => setNovoPost(e.target.value)} 
                    style={textareaStyle}
                  />
                  <div style={{display: 'flex', justifyContent: 'flex-end', marginTop: '10px'}}>
                    <button onClick={enviarPost} style={btnPostar}>Fragmentar</button>
                  </div>
                </div>
              </div>

              {posts.map(p => (
                <article key={p.id} style={postCardStyle}>
                  <div style={headerPost}>
                    <AvatarAutor uid={p.autorUid} fallbackFoto={p.autorFoto} />
                    <div>
                      <strong style={nomeAutor}>{p.autorNome}</strong>
                      <small style={dataPost}>{p.data?.toDate()?.toLocaleDateString()}</small>
                    </div>
                  </div>
                  
                  <Link to={`/post/${p.id}`} style={linkPost}>
                    <p style={corpoPost}>{p.texto}</p>
                  </Link>

                  <div style={barraInteracao}>
                    <button style={btnAcao}>🤍 {p.curtidas?.length || 0}</button>
                    <Link to={`/post/${p.id}`} style={btnAcao}>💬 {p.comentariosCount || 0}</Link>
                    <button style={btnAcao}>🔄</button>
                    <button style={btnAcao}>🔗</button>
                  </div>
                </article>
              ))}
            </>
          )}

          {/* ABA SOBRE & MEMBROS (Mobile) */}
          {isMobile && abaAtiva === 'sobre' && (
            <div style={cardStyle}>
              <h2 style={sTitle}>Sobre a Comunidade</h2>
              <p style={descricaoTexto}>{comu.descricao}</p>
              <div style={divisor} />
              <h4>Membros Ativos ({comu.membrosCount || 1})</h4>
              <div style={gridMembros}>
                <AvatarAutor uid={usuario?.uid} fallbackFoto={usuario?.photoURL} />
              </div>
            </div>
          )}

          {/* ABA GESTÃO (Apenas Mobile para o Autor) */}
          {isMobile && abaAtiva === 'gestao' && (
            <div style={cardStyle}>
              <h2 style={{color: '#d32f2f', fontSize: '20px'}}>Centro de Comando</h2>
              <p style={descricaoTexto}>Controle as permissões e a alma da sua comunidade.</p>
              
              <div style={listaGestao}>
                <button onClick={() => navigate(`/comunidades/${id}/editar`)} style={itemGestao}>✏️ Editar Perfil e Cores</button>
                <button style={itemGestao}>👥 Gerir Moderadores</button>
                <button style={itemGestao}>🚫 Membros Banidos</button>
                <button style={itemGestao}>📊 Estatísticas de Crescimento</button>
              </div>
            </div>
          )}
        </main>

        {/* COLUNA 3: SIDEBAR DIREITA (Desktop) */}
        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4 style={sSubTitle}>Exploradores</h4>
              <div style={gridMembros}>
                <AvatarAutor uid={usuario?.uid} fallbackFoto={usuario?.photoURL} tamanho="35px" />
              </div>
            </div>
          </SidebarDireita>
        )}

      </div>
    </div>
  )
}

// --- DESIGN SYSTEM (SOPHISTICATED) ---
const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };
const bannerHeroStyle = (c, m) => ({ width: '100%', height: m ? '160px' : '300px', background: c?.startsWith('http') ? `url(${c}) center/cover` : c, borderRadius: m ? '0' : '0 0 30px 30px', position: 'relative' });
const iconeBannerWrapper = (m) => ({ width: m ? '70px' : '100px', height: m ? '70px' : '100px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: m ? '35px' : '50px', position: 'absolute', bottom: '-35px', left: m ? '50%' : '40px', transform: m ? 'translateX(-50%)' : 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' });
const layoutGrid = (m) => ({ display: 'flex', gap: '30px', marginTop: m ? '60px' : '40px', paddingBottom: '100px' });
const cardStyle = { background: 'white', padding: '25px', borderRadius: '22px', border: '1px solid #f0f0f0', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' };
const postCardStyle = { ...cardStyle, marginBottom: '20px' };
const cardPostar = { ...cardStyle, display: 'flex', gap: '15px', marginBottom: '30px' };
const sTitle = { fontSize: '24px', fontWeight: '800', color: '#1a1a1a', marginBottom: '8px' };
const badgeStyle = { background: '#f0f4ff', color: '#002776', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' };
const descricaoTexto = { color: '#666', lineHeight: '1.6', fontSize: '14px', marginTop: '12px' };
const btnAdmin = { width: '100%', marginTop: '20px', padding: '12px', borderRadius: '14px', border: 'none', background: '#002776', color: 'white', fontWeight: 'bold', cursor: 'pointer' };
const textareaStyle = { width: '100%', border: 'none', outline: 'none', fontSize: '16px', resize: 'none', minHeight: '60px', background: 'transparent' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold' };
const barraInteracao = { display: 'flex', justifyContent: 'space-between', marginTop: '18px', borderTop: '1px solid #f9f9f9', paddingTop: '15px' };
const btnAcao = { background: 'none', border: 'none', color: '#888', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none' };
const tabContainer = { display: 'flex', justifyContent: 'center', gap: '15px', marginTop: '50px', padding: '0 10px' };
const tabAtiva = { flex: 1, padding: '12px', border: 'none', background: 'none', borderBottom: '3px solid #002776', fontWeight: 'bold', color: '#002776' };
const tabAtivaGestao = { ...tabAtiva, borderBottomColor: '#d32f2f', color: '#d32f2f' };
const tabInativa = { flex: 1, padding: '12px', border: 'none', background: 'none', color: '#999' };
const itemGestao = { width: '100%', padding: '15px', textAlign: 'left', background: '#f8f9fa', border: '1px solid #eee', borderRadius: '12px', marginBottom: '10px', cursor: 'pointer', fontSize: '14px', fontWeight: '500' };
const listaGestao = { marginTop: '25px' };
const divisor = { margin: '20px 0', border: '0.5px solid #eee' };
const gridMembros = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '15px' };
const headerPost = { display: 'flex', gap: '12px', alignItems: 'center' };
const nomeAutor = { color: '#1a1a1a', fontWeight: '700' };
const dataPost = { color: '#bbb', fontSize: '12px', display: 'block' };
const linkPost = { textDecoration: 'none', color: 'inherit' };
const corpoPost = { marginTop: '15px', color: '#333', lineHeight: '1.6' };
const sSubTitle = { fontSize: '14px', color: '#999', textTransform: 'uppercase', letterSpacing: '1px' };
const msgAviso = { padding: '100px', textAlign: 'center' };

export default PaginaComunidade;