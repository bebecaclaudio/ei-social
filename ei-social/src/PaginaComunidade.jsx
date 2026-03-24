import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';

// IMPORTANTE: Use o componente AvatarAutor que já corrigimos antes
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
      alignItems: 'center', justifyContent: 'center', border: '1px solid #ddd'
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
      {/* BANNER COM AVATAR FLUTUANTE CORRIGIDO */}
      <div style={{ height: '260px', background: comu.capaUrl || '#002776', position: 'relative' }}>
        <div style={avatarFlutuante}>{comu.emoji || '👑'}</div>
      </div>

      <div style={isMobile ? layoutMobile : layoutDesktop}>
        
        {/* COLUNA ESQUERDA - INFO */}
        {!isMobile && (
          <aside style={{ flex: '0 0 300px' }}>
            <div style={cardLateral}>
              <h2 style={{fontWeight:'900', fontSize:'22px'}}>{comu.nome}</h2>
              <span style={badge}>{comu.categoria}</span>
              <p style={{color:'#666', margin:'15px 0'}}>Bem-vindos à {comu.nome}!</p>
              <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAmarelo}>
                ⚙️ Gerenciar Comunidade
              </button>
            </div>
          </aside>
        )}

        {/* COLUNA CENTRAL - FEED */}
        <main style={{ flex: 1, maxWidth: isMobile ? '100%' : '600px' }}>
          <div style={cardInput}>
            <div style={{ display: 'flex', gap: '12px' }}>
              {/* USANDO O AVATARAUTOR PARA MINHA FOTO NO INPUT */}
              <AvatarAutor uid={usuario?.uid} tamanho="45px" />
              <textarea 
                placeholder={`No que você está pensando, ${usuario?.displayName?.split(' ')[0]}?`}
                value={novoPost}
                onChange={(e) => setNovoPost(e.target.value)}
                style={textareaEstilo}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button onClick={enviarPost} style={btnPublicar}>Postar</button>
            </div>
          </div>

          {posts.map(p => (
            <CardPostComunidade key={p.id} p={p} usuario={usuario} nomeComu={comu.nome} slugComu={comu.slug} />
          ))}
        </main>

        {/* COLUNA DIREITA - MEMBROS (PREPARADA PARA O BOTÃO) */}
        {!isMobile && (
          <aside style={{ flex: '0 0 280px' }}>
            <div style={cardLateral}>
              <h4 style={{color:'#888', marginBottom:'15px'}}>Membros</h4>
              <div style={gridMembros}>
                {/* Aqui entrará o seu map de 6 ou 9 bolinhas */}
                <AvatarAutor uid={usuario?.uid} tamanho="40px" />
              </div>
              <button style={btnVerMaisMembros}>Ver todos os membros</button>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS RESGATADOS E PROPORCIONAIS ---
const avatarFlutuante = {
  width: '110px', height: '110px', background: 'white', borderRadius: '28px',
  position: 'absolute', bottom: '-55px', left: '10%',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  fontSize: '55px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', zIndex: 10
};

const layoutDesktop = { display: 'flex', justifyContent: 'center', margin: '80px auto 0', gap: '25px', padding: '0 20px', maxWidth: '1280px' };
const layoutMobile = { display: 'flex', flexDirection: 'column', padding: '75px 15px', gap: '20px' };

const cardLateral = { background: 'white', padding: '25px', borderRadius: '25px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const badge = { background: '#eef2ff', color: '#5865f2', padding: '5px 15px', borderRadius: '20px', fontWeight: 'bold', fontSize: '12px' };

const cardInput = { background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '20px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' };
const textareaEstilo = { width: '100%', border: 'none', outline: 'none', fontSize: '16px', resize: 'none', minHeight: '60px', color: '#1a1a1a' };

const btnPublicar = { background: '#00a859', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' };
const btnAmarelo = { width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginBottom: '15px' };
const btnVerMaisMembros = { background: 'none', border: 'none', color: '#002776', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' };

export default PaginaComunidade;