import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { db } from './firebase-config'
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  addDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, arrayRemove 
} from 'firebase/firestore'
import { SidebarEsquerda, SidebarDireita } from './Sidebars'

// --- COMPONENTE AVATAR ---
function AvatarAutor({ uid, fallbackEmoji, tamanho = '40px' }) {
  const [fotoUrl, setFotoUrl] = useState(null)
  useEffect(() => {
    if (!uid) return
    const carregarFoto = async () => {
      const userDoc = await getDoc(doc(db, "usuarios", uid))
      if (userDoc.exists()) setFotoUrl(userDoc.data().foto)
    }
    carregarFoto()
  }, [uid])
  const ehLink = (str) => typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:image'));
  const imagemParaExibir = fotoUrl || (ehLink(fallbackEmoji) ? fallbackEmoji : null);
  return (
    <div style={{ 
      width: tamanho, height: tamanho, borderRadius: '50%', 
      overflow: 'hidden', background: '#eee', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', flexShrink: 0
    }}>
      {imagemParaExibir ? <img src={imagemParaExibir} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : 
      <span style={{ fontSize: parseInt(tamanho) * 0.5 + 'px' }}>{fallbackEmoji && !ehLink(fallbackEmoji) ? fallbackEmoji : '👤'}</span>}
    </div>
  )
}

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

  // Carregar dados da Comunidade
  useEffect(() => {
    setCarregando(true)
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
      setCarregando(false)
    }, (error) => { console.error("Erro na comu:", error); setCarregando(false); });
    return () => unsub();
  }, [id]);

  // Carregar Posts da Comunidade
  useEffect(() => {
    if (!comu?.id) return;
    // DICA: Se não aparecer, verifique o console do navegador (F12) para clicar no link de "Criar Índice" do Firebase
    const q = query(
      collection(db, "posts_comunidades"), 
      where("comunidadeId", "==", comu.id), 
      orderBy("data", "desc")
    )
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    }, (err) => {
      console.warn("Aguardando índice ou erro nos posts:", err);
    });
    return () => unsub()
  }, [comu?.id]);

  async function enviarPost() {
    if (!novoPost.trim() || !comu?.id || !usuario?.uid) return
    const fotoParaSalvar = usuario?.foto || usuario?.photoURL || "";
    try {
      await addDoc(collection(db, "posts_comunidades"), {
        comunidadeId: comu.id,
        autorUid: usuario.uid,
        autorNome: usuario.displayName || "Membro",
        autorFoto: fotoParaSalvar, 
        texto: novoPost,
        data: serverTimestamp(),
        curtidas: [],
        salvos: [],
        reposts: 0,
        comentariosCount: 0
      })
      setNovoPost('')
    } catch (e) { console.error("Erro ao postar:", e); }
  }

  // Funções de Interação
  const toggleLike = async (postId, listaCurtidas) => {
    const postRef = doc(db, "posts_comunidades", postId);
    const curtiu = listaCurtidas?.includes(usuario.uid);
    await updateDoc(postRef, {
      curtidas: curtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
    });
  };

  const toggleSave = async (postId, listaSalvos) => {
    const postRef = doc(db, "posts_comunidades", postId);
    const salvou = listaSalvos?.includes(usuario.uid);
    await updateDoc(postRef, {
      salvos: salvou ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
    });
  };

  if (carregando) return <div style={msgAviso}>Carregando...</div>
  if (!comu) return <div style={msgAviso}>Comunidade não encontrada.</div>

  const eDono = comu.criadoPor === usuario?.uid
  const minhaFoto = usuario?.foto || usuario?.photoURL || '👤';

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
              {eDono && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciarAmarelo}>
                  ⚙️ Gerenciar Comunidade
                </button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          {/* Box de Novo Post */}
          <div style={cardStyle}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <AvatarAutor uid={usuario?.uid} fallbackEmoji={minhaFoto} tamanho="45px" />
              <textarea 
                placeholder={`O que há de novo na ${comu.nome}?`}
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={textareaStyle}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
              <button onClick={enviarPost} style={btnPostar}>Postar Fragmento</button>
            </div>
          </div>

          {/* Feed de Posts */}
          {posts.map(p => {
            const curtiu = p.curtidas?.includes(usuario?.uid);
            const salvou = p.salvos?.includes(usuario?.uid);

            return (
              <div key={p.id} style={{ ...cardStyle, marginTop: '15px', cursor: 'default' }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '12px' }}>
                  <AvatarAutor uid={p.autorUid} fallbackEmoji={p.autorFoto} />
                  <div>
                    <strong style={{ display: 'block', color: '#1a1a1a', fontSize: '15px' }}>{p.autorNome}</strong>
                    <small style={{ color: '#999' }}>{p.data?.toDate()?.toLocaleString()}</small>
                  </div>
                </div>

                <Link to={`/post/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <p style={{ color: '#333', whiteSpace: 'pre-wrap', fontSize: '16px', lineHeight: '1.5' }}>{p.texto}</p>
                </Link>

                <hr style={{ border: 'none', borderTop: '1px solid #eee', margin: '15px 0' }} />

                {/* Barra de Ações */}
                <div style={barraAcoes}>
                  <button onClick={() => toggleLike(p.id, p.curtidas)} style={btnAcao(curtiu, '#ff4b4b')}>
                    {curtiu ? '❤️' : '🤍'} {p.curtidas?.length || 0}
                  </button>

                  <Link to={`/post/${p.id}`} style={{ textDecoration: 'none' }}>
                    <button style={btnAcao(false, '#002776')}>
                      💬 {p.comentariosCount || 0}
                    </button>
                  </Link>

                  <button style={btnAcao(false, '#009c3b')}>
                    🔄 {p.reposts || 0}
                  </button>

                  <button onClick={() => toggleSave(p.id, p.salvos)} style={btnAcao(salvou, '#ffdf00')}>
                    {salvou ? '⭐' : '☆'}
                  </button>
                </div>
              </div>
            );
          })}
        </main>

        {!isMobile && (
          <SidebarDireita>
            <div style={cardStyle}>
              <h4 style={{ marginBottom: '15px', color: '#002776' }}>Membros ({comu.membrosCount || 1})</h4>
              <div style={gridMembros}>
                 <AvatarAutor uid={usuario?.uid} fallbackEmoji={minhaFoto} tamanho="40px" />
              </div>
            </div>
          </SidebarDireita>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS ADICIONAIS ---
const barraAcoes = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 5px' };
const btnAcao = (ativo, cor) => ({
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px', 
  color: ativo ? cor : '#666', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '5px',
  transition: 'transform 0.2s', padding: '5px 10px', borderRadius: '8px'
});

// Estilos mantidos e otimizados
const containerPrincipal = { maxWidth: '1100px', margin: '0 auto', padding: '0 10px' };
const bannerHero = (capa, isMobile) => ({ width: '100%', height: isMobile ? '160px' : '300px', background: capa?.startsWith('http') || capa?.startsWith('data') ? `url(${capa}) center/cover no-repeat` : capa, borderRadius: '0 0 25px 25px', position: 'relative', boxShadow: 'inset 0 -60px 100px rgba(0,0,0,0.2)' });
const iconeBanner = (isMobile) => ({ width: isMobile ? '70px' : '100px', height: isMobile ? '70px' : '100px', background: 'white', borderRadius: '22px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: isMobile ? '35px' : '50px', position: 'absolute', bottom: '-35px', left: isMobile ? '50%' : '40px', transform: isMobile ? 'translateX(-50%)' : 'none', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', border: '4px solid white' });
const layoutGrid = (isMobile) => ({ display: 'flex', gap: '25px', marginTop: isMobile ? '50px' : '40px', paddingBottom: '80px' });
const cardStyle = { background: 'white', padding: '20px', borderRadius: '18px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid #f0f0f0' };
const tituloComu = { fontSize: '24px', margin: '0 0 10px 0', color: '#002776', textAlign: 'center', fontWeight: '800' };
const badgeStyle = { background: '#ffdf00', padding: '6px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: '900', color: '#000', display: 'inline-block', letterSpacing: '0.5px' };
const descricaoTexto = { fontSize: '14px', color: '#555', marginTop: '15px', textAlign: 'center', lineHeight: '1.4' };
const btnGerenciarAmarelo = { width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px', border: 'none', background: '#FFD700', color: '#000', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 0 #CCAC00', transition: '0.2s' };
const textareaStyle = { flex: 1, minHeight: '100px', border: '1px solid #eee', borderRadius: '15px', padding: '15px', outline: 'none', resize: 'none', boxSizing: 'border-box', backgroundColor: '#fcfcfc', color: '#1a1a1a', fontSize: '15px' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '12px 30px', borderRadius: '30px', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0,156,59,0.3)' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(40px, 1fr))', gap: '10px', marginTop: '10px' };
const msgAviso = { padding: '150px', textAlign: 'center', fontSize: '18px', color: '#666' };

export default PaginaComunidade;