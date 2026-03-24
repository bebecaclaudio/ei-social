import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

function PaginaComunidade({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [largura, setLargura] = useState(window.innerWidth);

  useEffect(() => {
    const handleResize = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = largura <= 992;

  useEffect(() => {
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setComu({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, [id]);

  useEffect(() => {
    if (!comu?.id) return;
    const q = query(collection(db, "posts_comunidades"), where("comunidadeId", "==", comu.id), orderBy("data", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [comu?.id]);

  async function enviarPost() {
    if (!novoPost.trim() || !usuario) return;
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id,
      comunidadeSlug: comu.slug,
      comunidadeNome: comu.nome,
      autorUid: usuario.uid,
      autorNome: usuario.displayName,
      autorFoto: usuario.photoURL,
      texto: novoPost,
      data: serverTimestamp(),
      curtidas: [],
      visualizacoes: 0,
      comentariosCount: 0
    });
    setNovoPost('');
  }

  if (!comu) return <div style={loading}>Carregando...</div>;

  return (
    <div style={bgPagina}>
      {/* BANNER COM ALTURA CORRETA */}
      <div style={bannerStyle(comu.capaUrl || '#002776')}>
        {/* AVATAR FLUTUANTE - POSIÇÃO RESGATADA ✅ */}
        <div style={avatarCapaWrapper}>
          {comu.emoji || '👑'}
        </div>
      </div>

      <div style={isMobile ? layoutMobile : layoutDesktop}>
        
        {/* COLUNA ESQUERDA (INFO) */}
        {!isMobile && (
          <aside style={{ flex: '0 0 280px' }}>
            <div style={cardLateral}>
              <h2 style={tituloComu}>{comu.nome}</h2>
              <div style={badgeCat}>{comu.categoria}</div>
              <p style={descrito}>Bem-vindos!</p>
              <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAmarelo}>
                ⚙️ Gerenciar Comunidade
              </button>
            </div>
          </aside>
        )}

        {/* COLUNA CENTRAL (FEED) */}
        <main style={{ flex: 1, maxWidth: isMobile ? '100%' : '650px' }}>
          {isMobile && <h2 style={tituloMobile}>{comu.nome}</h2>}
          
          <div style={cardInput}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <img src={usuario?.photoURL} style={avatarPerfil} alt="" />
              <textarea 
                placeholder={`O que há de novo na ${comu.nome}?`}
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={inputArea}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button onClick={enviarPost} style={btnVerde}>Postar</button>
            </div>
          </div>

          {posts.map(p => (
            <CardPostComunidade 
              key={p.id} p={p} usuario={usuario} 
              nomeComu={comu.nome} slugComu={comu.slug} 
            />
          ))}
        </main>

        {/* COLUNA DIREITA (MEMBROS) */}
        {!isMobile && (
          <aside style={{ flex: '0 0 250px' }}>
            <div style={cardLateral}>
              <h4 style={metaTitulo}>Membros</h4>
              <div style={listaMembros}>
                <img src={usuario?.photoURL} style={avatarMembro} alt="" />
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS COM PROPORÇÕES REAIS ---
const bgPagina = { backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: 'sans-serif' };

const bannerStyle = (bg) => ({
  height: '240px',
  background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg,
  position: 'relative',
  borderBottom: '1px solid rgba(0,0,0,0.1)'
});

const avatarCapaWrapper = {
  width: '110px', height: '110px', background: 'white', borderRadius: '28px',
  position: 'absolute', bottom: '-55px', left: '10%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '55px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', zIndex: 10
};

const layoutDesktop = { display: 'flex', justifyContent: 'center', margin: '80px auto 0', gap: '25px', padding: '0 20px', maxWidth: '1250px' };
const layoutMobile = { display: 'flex', flexDirection: 'column', padding: '75px 15px 20px', gap: '20px' };

const cardLateral = { background: 'white', padding: '22px', borderRadius: '22px', textAlign: 'center', border: '1px solid #e1e8ed' };
const tituloComu = { fontSize: '22px', fontWeight: '800', margin: '10px 0', color: '#0f1419' };
const tituloMobile = { fontSize: '22px', fontWeight: '800', marginBottom: '15px', color: '#0f1419' };

const badgeCat = { background: '#eef2ff', color: '#5865f2', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block' };
const descrito = { color: '#536471', fontSize: '14px', margin: '15px 0' };

const cardInput = { background: 'white', padding: '18px', borderRadius: '22px', marginBottom: '18px', border: '1px solid #e1e8ed' };
const inputArea = { width: '100%', border: 'none', outline: 'none', fontSize: '17px', resize: 'none', minHeight: '60px' };

const btnVerde = { background: '#00a859', color: 'white', border: 'none', padding: '10px 28px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' };
const btnAmarelo = { width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

const avatarPerfil = { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' };
const avatarMembro = { width: '38px', height: '38px', borderRadius: '50%', border: '2px solid #00a859' };
const metaTitulo = { color: '#888', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px', marginBottom: '15px' };
const listaMembros = { display: 'flex', justifyContent: 'center', gap: '8px' };
const loading = { textAlign: 'center', padding: '100px', fontSize: '20px', fontWeight: 'bold' };

export default PaginaComunidade;