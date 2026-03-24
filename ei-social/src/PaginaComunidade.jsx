import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

// --- COMPONENTE AVATARAUTOR ---
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

function PaginaComunidade({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [largura, setLargura] = useState(window.innerWidth);
  const [abaAtiva, setAbaAtiva] = useState('feed');

  const LIMITE_POST = 5000;

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
    if (!novoPost.trim() || novoPost.length > LIMITE_POST || !usuario) return;
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id, texto: novoPost, autorUid: usuario.uid,
      autorNome: usuario.displayName, autorFoto: usuario.photoURL || null,
      data: serverTimestamp(), curtidas: [], visualizacoes: 0
    });
    setNovoPost('');
  }

  if (!comu) return <div style={{textAlign:'center', padding:'50px'}}>Carregando...</div>;

  const MenuMobile = () => (
    <div style={menuMobileContainer}>
      {['feed', 'sobre', 'membros'].map(aba => (
        <button key={aba} onClick={() => setAbaAtiva(aba)} style={abaAtiva === aba ? btnAbaAtiva : btnAbaInativa}>
          <span style={{fontSize: '18px'}}>{aba === 'feed' ? '📰' : aba === 'sobre' ? 'ℹ️' : '👥'}</span>
          <span style={{fontSize: '11px', fontWeight: 'bold'}}>{aba.toUpperCase()}</span>
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: '80px' }}>
      <div style={containerBanner}>
        <div style={bannerEstilo(comu.capaUrl || '#002776')}>
          <div style={isMobile ? avatarFlutuanteMobile : avatarFlutuanteDesktop}>
            {comu.emoji || '✨'}
          </div>
        </div>
      </div>

      <div style={isMobile ? layoutMobile : layoutDesktop}>
        
        {/* COLUNA 1: SOBRE (DESKTOP) */}
        {!isMobile && (
          <aside style={{ flex: '0 0 300px' }}>
            <div style={cardBrancoCentrado}>
              <h1 style={tituloComu}>{comu.nome}</h1>
              <span style={badgeCat}>{comu.categoria}</span>
              <p style={descText}>{comu.descricao || "Comunidade oficial."}</p>
              {comu.criadoPor === usuario?.uid && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAmarelo}>⚙️ Gerenciar</button>
              )}
            </div>
          </aside>
        )}

        {/* COLUNA 2: FEED PRINCIPAL / CONTEÚDO DINÂMICO */}
        <main style={{ flex: 1, maxWidth: isMobile ? '100%' : '650px' }}>
          {isMobile && <MenuMobile />}

          {(abaAtiva === 'feed' || !isMobile) && (
            <div style={{ display: abaAtiva === 'feed' ? 'block' : 'none' }}>
              <div style={cardBrancoPostar}>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <AvatarAutor uid={usuario?.uid} tamanho="45px" />
                  <textarea 
                    placeholder="No que está pensando?" 
                    value={novoPost} 
                    onChange={(e) => setNovoPost(e.target.value)} 
                    style={inputTextArea}
                  />
                </div>
                <div style={{ textAlign: 'right', marginTop: '10px' }}>
                  <button onClick={enviarPost} style={btnVerde}>Postar</button>
                </div>
              </div>
              {posts.map(p => <CardPostComunidade key={p.id} p={p} usuario={usuario} slugComu={id} />)}
            </div>
          )}

          {abaAtiva === 'sobre' && isMobile && (
            <div style={cardBranco}>
              <h2 style={tituloComu}>Sobre</h2>
              <p>{comu.descricao}</p>
            </div>
          )}

          {abaAtiva === 'membros' && isMobile && (
            <div style={cardBranco}>
              <h2 style={tituloComu}>Membros</h2>
              <div style={gridMembros}>
                <AvatarAutor uid={usuario?.uid} tamanho="50px" />
              </div>
            </div>
          )}
        </main>

        {/* COLUNA 3: MEMBROS (DESKTOP) - REATIVADA ✅ */}
        {!isMobile && (
          <aside style={{ flex: '0 0 280px' }}>
            <div style={cardBrancoCentrado}>
              <h4 style={labelMembros}>Membros</h4>
              <div style={gridMembros}>
                <AvatarAutor uid={usuario?.uid} tamanho="40px" />
                {/* Aqui entrará o map de membros reais em breve */}
              </div>
              <button style={btnLink}>Ver todos</button>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

// Estilos (simplificados para o exemplo, mantenha os seus anteriores)
const containerBanner = { maxWidth: '1280px', margin: '0 auto', position: 'relative' };
const bannerEstilo = (bg) => ({ height: '220px', background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, borderRadius: '0 0 25px 25px', display: 'flex', justifyContent: 'center' });
const avatarFlutuanteDesktop = { width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-50px', left: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', border: '4px solid white' };
const avatarFlutuanteMobile = { width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', border: '4px solid white' };
const layoutDesktop = { display: 'flex', justifyContent: 'center', marginTop: '70px', gap: '25px', padding: '0 20px' };
const layoutMobile = { display: 'flex', flexDirection: 'column', padding: '70px 10px 20px' };
const cardBranco = { background: 'white', padding: '20px', borderRadius: '25px', border: '1px solid #ddd' };
const cardBrancoCentrado = { ...cardBranco, textAlign: 'center' };
const cardBrancoPostar = { ...cardBranco, marginBottom: '10px' };
const tituloComu = { fontSize: '20px', fontWeight: '900' };
const badgeCat = { background: '#eef2ff', color: '#5865f2', padding: '4px 10px', borderRadius: '15px', fontSize: '12px' };
const descText = { color: '#666', fontSize: '14px' };
const inputTextArea = { width: '100%', border: 'none', outline: 'none', resize: 'none', minHeight: '60px' };
const btnVerde = { background: '#00a859', color: 'white', border: 'none', padding: '8px 20px', borderRadius: '12px', fontWeight: 'bold' };
const btnAmarelo = { width: '100%', padding: '10px', background: '#FFD700', border: 'none', borderRadius: '12px', fontWeight: '900' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', marginTop: '15px' };
const labelMembros = { color: '#888', fontSize: '12px', textTransform: 'uppercase' };
const btnLink = { background: 'none', border: 'none', color: '#002776', fontWeight: 'bold', marginTop: '10px' };
const menuMobileContainer = { display: 'flex', background: 'white', borderBottom: '1px solid #eee', marginBottom: '10px' };
const btnAba = { flex: 1, padding: '10px', background: 'none', border: 'none' };
const btnAbaInativa = { ...btnAba, color: '#999' };
const btnAbaAtiva = { ...btnAba, color: '#002776', borderBottom: '3px solid #002776' };

export default PaginaComunidade;