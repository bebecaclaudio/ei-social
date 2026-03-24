import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from './firebase-config'
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  addDoc, serverTimestamp, updateDoc, deleteDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore'
import { SidebarEsquerda, SidebarDireita } from './Sidebars'

// --- UTILS: FORMATAÇÃO DE TEMPO ---
const formatarDataTwitter = (dataFirestore) => {
  if (!dataFirestore) return 'Sincronizando...';
  const data = dataFirestore.toDate();
  
  // Ex: 3:45 PM
  const hora = data.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit', 
    hour12: true 
  });
  
  // Ex: 24 de mar de 2026
  const dataExtenso = data.toLocaleDateString('pt-BR', { 
    day: 'numeric', 
    month: 'short', 
    year: 'numeric' 
  });
  
  return `${hora} · ${dataExtenso}`;
}

function PaginaComunidade({ usuario }) {
  const { id } = useParams() 
  const navigate = useNavigate()
  
  // Estados Principais
  const [comu, setComu] = useState(null)
  const [posts, setPosts] = useState([])
  const [novoPost, setNovoPost] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [abaAtiva, setAbaAtiva] = useState('feed') 
  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth)
  
  const isMobile = larguraJanela < 768

  // Listener de Redimensionamento
  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Buscar Dados da Comunidade (Real-time)
  useEffect(() => {
    const q = query(collection(db, "comunidades"), where("slug", "==", id))
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      }
    })
  }, [id])

  // Buscar Posts da Comunidade (Real-time)
  useEffect(() => {
    if (!comu?.id) return
    const q = query(
      collection(db, "posts_comunidades"), 
      where("comunidadeId", "==", comu.id), 
      orderBy("data", "desc")
    )
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    })
  }, [comu?.id])

  // --- LÓGICA DE INTERAÇÃO ---

  async function enviarPost() {
    if (!novoPost.trim() || !comu?.id || !usuario?.uid) return
    setEnviando(true)
    try {
      await addDoc(collection(db, "posts_comunidades"), {
        comunidadeId: comu.id,
        autorUid: usuario.uid,
        autorNome: usuario.displayName || "Membro",
        autorFoto: usuario.photoURL || "",
        texto: novoPost,
        data: serverTimestamp(),
        curtidas: [],
        reposts: [],
        comentariosCount: 0
      })
      setNovoPost('')
    } catch (err) {
      console.error("Erro ao fragmentar:", err)
    } finally {
      setEnviando(false)
    }
  }

  async function salvarRascunho() {
    if (!novoPost.trim() || !usuario?.uid) return
    try {
      await addDoc(collection(db, "rascunhos"), {
        usuarioUid: usuario.uid,
        texto: novoPost,
        data: serverTimestamp()
      })
      setNovoPost('')
      alert("Fragmento guardado nos rascunhos! ✍️")
    } catch (err) {
      alert("Erro ao salvar rascunho.")
    }
  }

  const toggleLike = async (pId, lista) => {
    if (!usuario?.uid) return
    const ref = doc(db, "posts_comunidades", pId)
    const jaCurtiu = lista?.includes(usuario.uid)
    await updateDoc(ref, { 
      curtidas: jaCurtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid) 
    })
  }

  const excluirPost = async (pId) => {
    if (window.confirm("Deseja apagar este fragmento permanentemente?")) {
      await deleteDoc(doc(db, "posts_comunidades", pId))
    }
  }

  const editarPost = async (pId, textoAntigo) => {
    const novoTexto = window.prompt("Edite seu fragmento:", textoAntigo)
    if (novoTexto && novoTexto !== textoAntigo) {
      await updateDoc(doc(db, "posts_comunidades", pId), { texto: novoTexto })
    }
  }

  if (!comu) return <div style={msgAviso}>Sincronizando com a Pleiadians...</div>

  const isOwner = comu.criadoPor === usuario?.uid

  return (
    <div style={containerPrincipal}>
      {/* HEADER / BANNER */}
      <div style={bannerHeroStyle(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBannerWrapper(isMobile)}>{comu.emoji || '✨'}</div>
      </div>

      {/* NAVEGAÇÃO MOBILE */}
      {isMobile && (
        <div style={tabContainer}>
          <button onClick={() => setAbaAtiva('feed')} style={abaAtiva === 'feed' ? tabAtiva : tabInativa}>Feed</button>
          <button onClick={() => setAbaAtiva('sobre')} style={abaAtiva === 'sobre' ? tabAtiva : tabInativa}>Sobre</button>
          <button onClick={() => setAbaAtiva('membros')} style={abaAtiva === 'membros' ? tabAtiva : tabInativa}>Membros</button>
        </div>
      )}

      <div style={layoutGrid(isMobile)}>
        
        {/* COLUNA ESQUERDA (DESKTOP) */}
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              <h2 style={sTitle}>{comu.nome}</h2>
              <span style={badgeStyle}>{comu.categoria}</span>
              <p style={descricaoTexto}>{comu.descricao}</p>
              {isOwner && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAmareloConfig}>
                  ⚙️ Configurações
                </button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        {/* FEED CENTRAL */}
        <main style={{ flex: 1, minWidth: '0' }}>
          {(abaAtiva === 'feed' || !isMobile) && (
            <>
              {/* COMPOSITOR DE POST */}
              <div style={cardPostar}>
                <textarea 
                  placeholder="O que você está concatenando?"
                  value={novoPost} 
                  onChange={(e) => setNovoPost(e.target.value)} 
                  style={textareaStyle}
                />
                <div style={barraBotoesPostar}>
                  <button onClick={salvarRascunho} style={btnRascunho}>Salvar Rascunho</button>
                  <button onClick={enviarPost} style={btnPostar} disabled={enviando}>
                    {enviando ? 'Enviando...' : 'Fragmentar'}
                  </button>
                </div>
              </div>

              {/* LISTA DE POSTS */}
              {posts.map(p => (
                <article key={p.id} style={postCardStyle}>
                  <div style={headerPost}>
                    <div style={{display: 'flex', gap: '12px', alignItems: 'center'}}>
                      <img src={p.autorFoto || 'https://via.placeholder.com/40'} style={avatarMini} alt="" />
                      <div>
                        <strong style={nomeAutor}>{p.autorNome}</strong>
                        <small style={dataPostEstilo}>{formatarDataTwitter(p.data)}</small>
                      </div>
                    </div>
                    {p.autorUid === usuario?.uid && (
                      <div style={{display: 'flex', gap: '8px'}}>
                        <button onClick={() => editarPost(p.id, p.texto)} style={btnIconeMini}>✏️</button>
                        <button onClick={() => excluirPost(p.id)} style={btnIconeMiniRed}>🗑️</button>
                      </div>
                    )}
                  </div>
                  
                  <Link to={`/post/${p.id}`} style={linkPost}>
                    <p style={corpoPost}>{p.texto}</p>
                  </Link>

                  <div style={barraInteracao}>
                    <button onClick={() => toggleLike(p.id, p.curtidas)} style={btnAcao(p.curtidas?.includes(usuario?.uid), '#ff4b4b')}>
                      {p.curtidas?.includes(usuario?.uid) ? '❤️' : '🤍'} {p.curtidas?.length || 0}
                    </button>
                    <Link to={`/post/${p.id}`} style={btnAcao(false, '#002776')}>💬 {p.comentariosCount || 0}</Link>
                    <button style={btnAcao(false, '#009c3b')}>🔄</button>
                    <button onClick={() => alert("Salvo!")} style={btnAcao(false, '#f1c40f')}>🔖</button>
                    <button onClick={() => {navigator.clipboard.writeText(`${window.location.origin}/post/${p.id}`); alert("Link copiado!")}} style={btnAcao(false, '#3498db')}>🔗</button>
                  </div>
                </article>
              ))}
            </>
          )}

          {/* CONTEÚDO ABAS MOBILE */}
          {isMobile && abaAtiva === 'sobre' && (
            <div style={cardStyle}><h2>Sobre</h2><p>{comu.descricao}</p></div>
          )}
          {isMobile && abaAtiva === 'membros' && (
            <div style={cardStyle}><h2>Membros</h2><p>Lista de membros em breve...</p></div>
          )}
        </main>

        {/* COLUNA DIREITA (DESKTOP) */}
        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}><h4>Membros</h4></div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- SISTEMA DE ESTILOS (CSS-IN-JS) ---
const containerPrincipal = { maxWidth: '1200px', margin: '0 auto', padding: '0 15px' };
const bannerHeroStyle = (c, m) => ({ width: '100%', height: m ? '160px' : '280px', background: c?.startsWith('http') ? `url(${c}) center/cover` : c, borderRadius: m ? '0' : '0 0 30px 30px', position: 'relative' });
const iconeBannerWrapper = (m) => ({ width: m ? '70px' : '100px', height: m ? '70px' : '100px', background: 'white', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: m ? '35px' : '50px', position: 'absolute', bottom: '-35px', left: m ? '50%' : '40px', transform: m ? 'translateX(-50%)' : 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.1)' });
const layoutGrid = (m) => ({ display: 'flex', gap: '25px', marginTop: m ? '60px' : '40px', paddingBottom: '100px' });
const cardStyle = { background: 'white', padding: '24px', borderRadius: '22px', border: '1px solid #f2f2f2' };
const postCardStyle = { ...cardStyle, marginBottom: '20px' };
const cardPostar = { ...cardStyle, marginBottom: '25px' };
const btnAmareloConfig = { width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px', background: '#FFD700', color: '#000', fontWeight: '900', border: 'none', cursor: 'pointer' };
const textareaStyle = { width: '100%', border: 'none', outline: 'none', fontSize: '16px', resize: 'none', minHeight: '90px', fontFamily: 'inherit' };
const barraBotoesPostar = { display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' };
const btnPostar = { background: '#002776', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const btnRascunho = { background: '#f5f5f5', color: '#666', border: 'none', padding: '10px 20px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const barraInteracao = { display: 'flex', justifyContent: 'space-between', marginTop: '16px', borderTop: '1px solid #fcfcfc', paddingTop: '12px' };
const btnAcao = (ativo, cor) => ({ background: 'none', border: 'none', cursor: 'pointer', color: ativo ? cor : '#999', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px', textDecoration: 'none' });
const avatarMini = { width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' };
const headerPost = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' };
const nomeAutor = { color: '#1a1a1a', fontWeight: '800', display: 'block' };
const dataPostEstilo = { color: '#777', fontSize: '12px', fontWeight: '400' };
const corpoPost = { fontSize: '16px', color: '#333', lineHeight: '1.6', marginTop: '8px' };
const linkPost = { textDecoration: 'none', color: 'inherit' };
const btnIconeMini = { background: 'none', border: 'none', cursor: 'pointer', opacity: 0.4, fontSize: '14px' };
const btnIconeMiniRed = { ...btnIconeMini, color: 'red' };
const sTitle = { fontSize: '22px', fontWeight: '900', color: '#002776' };
const badgeStyle = { background: '#eef2ff', color: '#002776', padding: '6px 14px', borderRadius: '16px', fontSize: '11px', fontWeight: '900' };
const descricaoTexto = { color: '#555', fontSize: '14px', marginTop: '12px', lineHeight: '1.5' };
const tabContainer = { display: 'flex', justifyContent: 'center', gap: '20px', marginTop: '45px' };
const tabAtiva = { border: 'none', background: 'none', borderBottom: '3px solid #002776', padding: '10px', fontWeight: 'bold', color: '#002776' };
const tabInativa = { border: 'none', background: 'none', padding: '10px', color: '#999' };
const msgAviso = { padding: '100px', textAlign: 'center', color: '#002776', fontWeight: 'bold' };

export default PaginaComunidade;