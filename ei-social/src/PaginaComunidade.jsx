import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

// --- COMPONENTE: AvatarRedondo ---
function AvatarRedondo({ uid, tamanho = '45px' }) {
  const [foto, setFoto] = useState(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "usuarios", uid)).then(d => d.exists() && setFoto(d.data().foto));
  }, [uid]);

  return (
    <div style={{ width: tamanho, height: tamanho, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1px solid #ddd' }}>
      <img src={foto || `https://ui-avatars.com/api/?name=U&background=random`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
    </div>
  );
}

function PaginaComunidade({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [hashtags, setHashtags] = useState('');
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
    if (!novoPost.trim() || novoPost.length > 5000 || !usuario) return;
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id, texto: novoPost, hashtags: hashtags,
      autorUid: usuario.uid, autorNome: usuario.displayName,
      data: serverTimestamp(), curtidas: [], visualizacoes: 0
    });
    setNovoPost('');
    setHashtags('');
  }

  function salvarRascunho() {
    localStorage.setItem(`rascunho_${id}`, JSON.stringify({ novoPost, hashtags }));
    alert("Rascunho salvo!");
  }

  if (!comu) return null;
  const souDono = comu.criadoPor === usuario?.uid;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: '30px' }}>
      
      {/* BANNER COM RESPIRO E AVATAR NO TOPO ESQUERDO */}
      {/* BANNER COM RESPIRO E AVATAR NO TOPO ESQUERDO (SEM A COROA!) */}
    <div style={containerBannerGeral}>
    <div style={estiloBanner(comu.capaUrl || '#002663')}>
        {/* Agora o emoji vem direto da sua coleção 'comunidades' */}
        <div style={avatarTopoEsquerdo}>{comu.emoji || '✨'}</div>
    </div>
    </div>

      <div style={gridMestre(isMobile)}>
        
        {/* SIDEBAR ESQUERDA */}
        <aside style={isMobile ? fullWidth : colLateral}>
          <div style={cardBranco}>
            <h1 style={tituloPretoSidebar}>{comu.nome}</h1>
            <span style={badgeCategoria}>{comu.categoria}</span>
            <p style={textoDesc}>{comu.descricao || "Bem-vinda à nossa egrégora."}</p>
            {souDono && (
              <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnGerenciarAmarelo}>
                ⚙️ Gerenciar Informações
              </button>
            )}
          </div>
        </aside>

        {/* FEED CENTRAL */}
        <main style={colCentro(isMobile)}>
          <div style={cardPostar}>
            <div style={{display: 'flex', gap: '12px', alignItems: 'flex-start'}}>
              <AvatarRedondo uid={usuario?.uid} />
              <div style={{flex: 1, minWidth: 0}}>
                <textarea 
                  value={novoPost} 
                  onChange={e => setNovoPost(e.target.value)} 
                  placeholder="No que você está concatenando?" 
                  style={inputAreaAjustado}
                  maxLength={5000}
                />
                <input 
                  type="text" 
                  placeholder="#hashtags" 
                  value={hashtags}
                  onChange={e => setHashtags(e.target.value)}
                  style={inputHashtags}
                />
              </div>
            </div>
            
            {/* RODAPÉ DO POST: CONTADOR E RASCUNHO À ESQUERDA, POSTAR À DIREITA */}
            <div style={botoesAcaoPost}>
              <div style={grupoEsquerdaAcao}>
                <span style={contadorChars}>{novoPost.length}/5000</span>
                <button onClick={salvarRascunho} style={btnRascunho}>Salvar rascunho</button>
              </div>
              <button onClick={enviarPost} style={btnPostVerde}>Postar</button>
            </div>
          </div>

          {posts.map(p => <CardPostComunidade key={p.id} p={p} usuario={usuario} slugComu={id} />)}
        </main>

        {/* SIDEBAR DIREITA (OCULTA NO MOBILE) */}
        {!isMobile && (
          <aside style={colLateral}>
            <div style={cardBranco}>
              <h4 style={subTitulo}>MEMBROS</h4>
              <div style={gridMembros}>
                <AvatarRedondo uid={usuario?.uid} tamanho="40px" />
                <button style={btnMais}>+</button>
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS ---
const containerBannerGeral = { maxWidth: '1150px', margin: '0 auto', padding: '20px 20px 0', position: 'relative' };
const estiloBanner = (bg) => ({ height: '220px', background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, borderRadius: '20px', position: 'relative' });
const avatarTopoEsquerdo = { width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-40px', left: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '4px solid white', zIndex: 10 };
const gridMestre = (mob) => ({ display: 'flex', flexDirection: mob ? 'column' : 'row', justifyContent: 'center', gap: '20px', padding: '0 20px', maxWidth: '1150px', margin: '60px auto 0' });
const colLateral = { width: '280px', position: 'sticky', top: '20px', alignSelf: 'flex-start' };
const colCentro = (mob) => ({ flex: 1, maxWidth: mob ? '100%' : '520px' });
const fullWidth = { width: '100%' };
const cardBranco = { background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e1e8ed' };
const tituloPretoSidebar = { fontSize: '24px', fontWeight: '900', color: '#000', margin: '0' };
const badgeCategoria = { color: '#5865f2', fontSize: '13px', fontWeight: 'bold' };
const textoDesc = { fontSize: '14px', color: '#555', marginTop: '10px' };
const cardPostar = { background: 'white', padding: '18px', borderRadius: '22px', border: '1px solid #e1e8ed', marginBottom: '20px' };
const inputAreaAjustado = { width: '100%', boxSizing: 'border-box', border: 'none', background: '#f8f9fa', borderRadius: '12px', minHeight: '90px', padding: '15px', outline: 'none', resize: 'none', fontSize: '16px' };
const inputHashtags = { width: '100%', border: 'none', background: 'none', padding: '5px 0', fontSize: '14px', color: '#5865f2', outline: 'none', marginTop: '8px' };
const botoesAcaoPost = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' };
const grupoEsquerdaAcao = { display: 'flex', alignItems: 'center', gap: '15px' };
const btnRascunho = { background: 'none', border: 'none', color: '#888', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' };
const btnPostVerde = { background: '#00a859', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnGerenciarAmarelo = { width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px', color: '#000', cursor: 'pointer' };
const contadorChars = { fontSize: '11px', color: '#bbb', fontWeight: 'bold' };
const subTitulo = { fontSize: '11px', color: '#aaa', fontWeight: '900', textAlign: 'center' };
const gridMembros = { display: 'flex', gap: '8px', justifyContent: 'center', marginTop: '15px' };
const btnMais = { width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#eee' };

export default PaginaComunidade;