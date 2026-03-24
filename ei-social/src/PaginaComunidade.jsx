import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';

// Componente de Avatar que você validou
function AvatarAutor({ uid, fallbackEmoji, tamanho = '45px' }) {
  const [fotoUrl, setFotoUrl] = useState(null);
  useEffect(() => {
    if (!uid) return;
    const carregarFoto = async () => {
      const userDoc = await getDoc(doc(db, "usuarios", uid));
      if (userDoc.exists()) setFotoUrl(userDoc.data().foto);
    };
    carregarFoto();
  }, [uid]);

  const imagemParaExibir = fotoUrl || (typeof fallbackEmoji === 'string' && fallbackEmoji.startsWith('http') ? fallbackEmoji : null);

  return (
    <div style={{ 
      width: tamanho, height: tamanho, borderRadius: '50%', 
      overflow: 'hidden', background: '#eee', display: 'flex', 
      alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd', flexShrink: 0
    }}>
      {imagemParaExibir ? (
        <img src={imagemParaExibir} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ fontSize: parseInt(tamanho) * 0.6 + 'px' }}>{fallbackEmoji || '👤'}</span>
      )}
    </div>
  );
}

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
      comunidadeId: comu.id, texto: novoPost, autorUid: usuario.uid,
      autorNome: usuario.displayName, data: serverTimestamp(),
      curtidas: [], visualizacoes: 0
    });
    setNovoPost('');
  }

  if (!comu) return <div style={{textAlign:'center', padding:'50px'}}>Carregando...</div>;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh' }}>
      
      {/* BANNER RESPONSIVO COM MARGENS ✅ */}
      <div style={containerGeral}>
        <div style={bannerEstilo(comu.capaUrl || '#002776')}>
          <div style={avatarFlutuante}>
            {comu.emoji || '✨'}
          </div>
        </div>
      </div>

      <div style={isMobile ? layoutMobile : layoutDesktop}>
        
        {/* COLUNA ESQUERDA */}
        {!isMobile && (
          <aside style={{ flex: '0 0 300px' }}>
            <div style={cardBranco}>
              <h2 style={titulo}>{comu.nome}</h2>
              <span style={badge}>{comu.categoria}</span>
              <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAmarelo}>
                ⚙️ Gerenciar
              </button>
            </div>
          </aside>
        )}

        {/* COLUNA CENTRAL (FEED) */}
        <main style={{ flex: 1, maxWidth: isMobile ? '100%' : '600px' }}>
          <div style={cardBranco}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <AvatarAutor uid={usuario?.uid} tamanho="45px" />
              <textarea 
                placeholder="No que você está pensando?"
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={inputTextArea}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button onClick={enviarPost} style={btnVerde}>Postar</button>
            </div>
          </div>

          {posts.map(p => (
            <CardPostComunidade key={p.id} p={p} usuario={usuario} />
          ))}
        </main>

        {/* COLUNA DIREITA */}
        {!isMobile && (
          <aside style={{ flex: '0 0 280px' }}>
            <div style={cardBranco}>
              <h4 style={subtitulo}>Membros</h4>
              <div style={gridMembros}>
                <AvatarAutor uid={usuario?.uid} tamanho="40px" />
              </div>
              <button style={btnTexto}>Ver todos</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS NEUTROS E RESPONSIVOS ---
const containerGeral = { maxWidth: '1280px', margin: '0 auto', padding: '0 15px' };

const bannerEstilo = (bg) => ({
  height: '250px',
  background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg,
  position: 'relative',
  borderRadius: '0 0 20px 20px',
  marginTop: '10px'
});

const avatarFlutuante = {
  width: '100px', height: '100px', background: 'white', borderRadius: '25px',
  position: 'absolute', bottom: '-50px', left: '50px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
};

const layoutDesktop = { display: 'flex', justifyContent: 'center', margin: '70px auto 0', gap: '20px', maxWidth: '1280px', padding: '0 15px' };
const layoutMobile = { display: 'flex', flexDirection: 'column', padding: '70px 15px 20px', gap: '15px' };

const cardBranco = { background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '15px', border: '1px solid #ddd' };
const titulo = { fontSize: '20px', fontWeight: 'bold', margin: '10px 0' };
const badge = { background: '#eee', padding: '4px 10px', borderRadius: '10px', fontSize: '12px' };
const subtitulo = { color: '#888', fontSize: '14px', marginBottom: '10px' };

const inputTextArea = { width: '100%', border: '1px solid #eee', borderRadius: '10px', padding: '10px', outline: 'none', resize: 'none', minHeight: '60px', background: '#fff' };
const btnVerde = { background: '#00a859', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnAmarelo = { width: '100%', padding: '10px', background: '#FFD700', border: 'none', borderRadius: '10px', fontWeight: 'bold', marginTop: '15px', cursor: 'pointer' };

const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' };
const btnTexto = { background: 'none', border: 'none', color: '#002776', fontWeight: 'bold', marginTop: '10px', cursor: 'pointer' };

export default PaginaComunidade;