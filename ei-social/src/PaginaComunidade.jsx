import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  doc, onSnapshot, collection, query, where, orderBy, 
  addDoc, serverTimestamp, getDoc, updateDoc, arrayUnion, arrayRemove, limit 
} from 'firebase/firestore';
import { SidebarEsquerda, SidebarDireita } from './Sidebars';

// --- COMPONENTE AVATAR (MEMÓRIA OTIMIZADA) ---
const AvatarAutor = React.memo(({ uid, fallbackEmoji, tamanho = '40px' }) => {
  const [fotoUrl, setFotoUrl] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const carregarFoto = async () => {
      try {
        const userDoc = await getDoc(doc(db, "usuarios", uid));
        if (userDoc.exists()) setFotoUrl(userDoc.data().foto);
      } catch (e) { console.error("Erro ao buscar avatar:", e); }
    };
    carregarFoto();
  }, [uid]);

  const ehLink = (str) => typeof str === 'string' && (str.startsWith('http') || str.startsWith('data:image'));
  const imagemParaExibir = fotoUrl || (ehLink(fallbackEmoji) ? fallbackEmoji : null);

  return (
    <div style={{ 
      width: tamanho, height: tamanho, borderRadius: '50%', 
      overflow: 'hidden', background: '#f0f0f0', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', border: '1.5px solid #eee', flexShrink: 0
    }}>
      {imagemParaExibir ? (
        <img src={imagemParaExibir} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: parseInt(tamanho) * 0.5 + 'px' }}>
          {fallbackEmoji && !ehLink(fallbackEmoji) ? fallbackEmoji : '👤'}
        </span>
      )}
    </div>
  );
});

function PaginaComunidade({ usuario }) {
  const { id } = useParams(); 
  const navigate = useNavigate();
  
  // Estados de Dados
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  
  // Estados de Controle
  const [carregando, setCarregando] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth);
  const isMobile = larguraJanela < 768;

  // Listener de Redimensionamento
  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Monitorar Dados da Comunidade (Real-time)
  useEffect(() => {
    setCarregando(true);
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      } else {
        setComu(null);
      }
      setCarregando(false);
    }, (error) => {
      console.error("Erro Firestore (Comunidade):", error);
      setCarregando(false);
    });
    return () => unsub();
  }, [id]);

  // 2. Monitorar Posts (Real-time com Ordenação)
  useEffect(() => {
    if (!comu?.id) return;
    const q = query(
      collection(db, "posts_comunidades"), 
      where("comunidadeId", "==", comu.id), 
      orderBy("data", "desc"),
      limit(50) // Performance: carrega apenas os 50 últimos
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const listaPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(listaPosts);
    }, (err) => {
      console.error("Erro Firestore (Posts) - Verifique se o Índice foi criado:", err);
    });
    return () => unsub();
  }, [comu?.id]);

  // Ação de Postar
  const enviarPost = async () => {
    if (!novoPost.trim() || enviando || !usuario) return;
    setEnviando(true);
    
    try {
      const userRef = doc(db, "usuarios", usuario.uid);
      const userSnap = await getDoc(userRef);
      const fotoAtual = userSnap.exists() ? userSnap.data().foto : (usuario.photoURL || "");

      await addDoc(collection(db, "posts_comunidades"), {
        comunidadeId: comu.id,
        autorUid: usuario.uid,
        autorNome: usuario.displayName || "Explorador",
        autorFoto: fotoAtual, 
        texto: novoPost,
        data: serverTimestamp(),
        curtidas: [],
        salvos: [],
        reposts: 0,
        comentariosCount: 0
      });
      setNovoPost('');
    } catch (e) {
      alert("Houve um erro ao fragmentar sua ideia. Tente novamente.");
    } finally {
      setEnviando(false);
    }
  };

  // Funções de Interação (Like/Save)
  const handleInteraction = async (postId, campo, acao) => {
    if (!usuario) return;
    const postRef = doc(db, "posts_comunidades", postId);
    try {
      await updateDoc(postRef, {
        [campo]: acao === 'add' ? arrayUnion(usuario.uid) : arrayRemove(usuario.uid)
      });
    } catch (e) { console.error("Falha na interação:", e); }
  };

  if (carregando) return <div style={msgAviso}>Sincronizando Fragmentos...</div>;
  if (!comu) return <div style={msgAviso}>Essa constelação (comunidade) não foi encontrada.</div>;

  const minhaFoto = usuario?.foto || usuario?.photoURL || '👤';

  return (
    <div style={containerPrincipal}>
      {/* HEADER DINÂMICO */}
      <div style={bannerHero(comu.capaUrl || comu.corCapa || '#002776', isMobile)}>
        <div style={iconeBanner(isMobile)}>{comu.emoji || '👥'}</div>
      </div>

      <div style={layoutGrid(isMobile)}>
        {!isMobile && (
          <SidebarEsquerda>
            <div style={cardStyle}>
              <h2 style={tituloComu}>{comu.nome}</h2>
              <div style={{ textAlign: 'center' }}>
                <span style={badgeStyle}>{comu.categoria}</span>
              </div>
              <p style={descricaoTexto}>{comu.descricao || "Bem-vindos à nossa frequência."}</p>
              
              {comu.criadoPor === usuario?.uid && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciar}>
                  ⚙️ Configurações
                </button>
              )}
            </div>
          </SidebarEsquerda>
        )}

        <main style={{ flex: isMobile ? '1 1 100%' : '1', minWidth: '0' }}>
          {/* ÁREA DE CRIAÇÃO */}
          <div style={{ ...cardStyle, marginBottom: '20px' }}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <AvatarAutor uid={usuario?.uid} fallbackEmoji={minhaFoto} tamanho="48px" />
              <textarea 
                placeholder={`O que você quer concatenar hoje em ${comu.nome}?`}
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={textareaStyle}
                disabled={enviando}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '12px' }}>
              <button 
                onClick={enviarPost} 
                style={{ ...btnPostar, opacity: (enviando || !novoPost.trim()) ? 0.6 : 1 }}
                disabled={enviando || !novoPost.trim()}
              >
                {enviando ? 'Enviando...' : 'Postar'}
              </button>
            </div>
          </div>

          {/* LISTA DE POSTS (FEED) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {posts.map(p => {
              const jaCurtiu = p.curtidas?.includes(usuario?.uid);
              const jaSalvou = p.salvos?.includes(usuario?.uid);

              return (
                <article key={p.id} style={cardPost}>
                  <header style={headerPost}>
                    <AvatarAutor uid={p.autorUid} fallbackEmoji={p.autorFoto} />
                    <div style={{ flex: 1 }}>
                      <span style={nomeAutor}>{p.autorNome}</span>
                      <time style={dataPost}>{p.data?.toDate()?.toLocaleDateString()} às {p.data?.toDate()?.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</time>
                    </div>
                  </header>

                  <Link to={`/post/${p.id}`} style={linkPost}>
                    <p style={corpoPost}>{p.texto}</p>
                  </Link>

                  <footer style={footerPost}>
                    <button 
                      onClick={() => handleInteraction(p.id, 'curtidas', jaCurtiu ? 'remove' : 'add')}
                      style={btnAcao(jaCurtiu, '#ff4b4b')}
                    >
                      {jaCurtiu ? '❤️' : '🤍'} <span>{p.curtidas?.length || 0}</span>
                    </button>

                    <Link to={`/post/${p.id}`} style={btnAcao(false, '#002776')}>
                      💬 <span>{p.comentariosCount || 0}</span>
                    </Link>

                    <button style={btnAcao(false, '#009c3b')}>
                      🔄 <span>{p.reposts || 0}</span>
                    </button>

                    <button 
                      onClick={() => handleInteraction(p.id, 'salvos', jaSalvou ? 'remove' : 'add')}
                      style={btnAcao(jaSalvou, '#ffdf00')}
                    >
                      {jaSalvou ? '⭐' : '☆'}
                    </button>
                  </footer>
                </article>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}

// --- DESIGN SYSTEM (SOPHISTICATED & CLEAN) ---
const containerPrincipal = { maxWidth: '1100px', margin: '0 auto', padding: '0 10px' };
const bannerHero = (capa, isMobile) => ({
  width: '100%', height: isMobile ? '150px' : '260px',
  background: capa?.startsWith('http') || capa?.startsWith('data') ? `url(${capa}) center/cover no-repeat` : capa,
  borderRadius: '0 0 24px 24px', position: 'relative'
});
const iconeBanner = (isMobile) => ({
  width: isMobile ? '70px' : '90px', height: isMobile ? '70px' : '90px',
  background: 'white', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: isMobile ? '35px' : '45px', position: 'absolute', bottom: '-35px',
  left: isMobile ? '50%' : '40px', transform: isMobile ? 'translateX(-50%)' : 'none',
  boxShadow: '0 8px 20px rgba(0,0,0,0.1)', border: '4px solid white'
});

const layoutGrid = (isMobile) => ({ display: 'flex', gap: '24px', marginTop: isMobile ? '50px' : '40px', paddingBottom: '80px' });
const cardStyle = { background: 'white', padding: '20px', borderRadius: '18px', border: '1px solid #f0f0f0', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' };

const cardPost = { ...cardStyle, transition: 'transform 0.2s', ':hover': { transform: 'translateY(-2px)' } };
const headerPost = { display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '15px' };
const nomeAutor = { display: 'block', fontWeight: 'bold', color: '#1a1a1a', fontSize: '15px' };
const dataPost = { fontSize: '12px', color: '#999' };
const linkPost = { textDecoration: 'none', color: 'inherit', display: 'block' };
const corpoPost = { fontSize: '16px', color: '#333', lineHeight: '1.6', whiteSpace: 'pre-wrap', margin: '0 0 15px 0' };
const footerPost = { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #f5f5f5', paddingTop: '12px' };

const btnAcao = (ativo, cor) => ({
  background: 'none', border: 'none', cursor: 'pointer', fontSize: '15px',
  color: ativo ? cor : '#666', display: 'flex', alignItems: 'center', gap: '6px',
  fontWeight: '600', padding: '6px 10px', borderRadius: '8px', transition: '0.2s'
});

const tituloComu = { fontSize: '22px', color: '#002776', textAlign: 'center', margin: '0 0 10px 0' };
const badgeStyle = { background: '#f0f4ff', color: '#002776', padding: '5px 15px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const descricaoTexto = { fontSize: '14px', color: '#666', textAlign: 'center', marginTop: '15px', lineHeight: '1.5' };
const btnGerenciar = { width: '100%', marginTop: '15px', padding: '10px', borderRadius: '10px', border: 'none', background: '#002776', color: 'white', fontWeight: 'bold', cursor: 'pointer' };

const textareaStyle = { flex: 1, minHeight: '90px', border: '1px solid #eee', borderRadius: '15px', padding: '15px', outline: 'none', resize: 'none', fontSize: '15px', backgroundColor: '#fafafa' };
const btnPostar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };
const msgAviso = { padding: '100px', textAlign: 'center', color: '#888' };

export default PaginaComunidade;