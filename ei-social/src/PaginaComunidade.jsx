import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

// --- COMPONENTE AVATARAUTOR (PARA REUSO) ---
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
  const { id } = useParams(); // Esse é o SLUG da URL
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

  // Carregar dados da Comunidade
  useEffect(() => {
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setComu({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, [id]);

  // Carregar Posts (Atenção ao orderBy!)
  useEffect(() => {
    if (!comu?.id) return;
    const q = query(
      collection(db, "posts_comunidades"), 
      where("comunidadeId", "==", comu.id), 
      orderBy("data", "desc")
    );
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [comu?.id]);

  async function enviarPost() {
    if (!novoPost.trim() || novoPost.length > LIMITE_POST || !usuario) return;
    
    try {
      await addDoc(collection(db, "posts_comunidades"), {
        comunidadeId: comu.id,
        texto: novoPost,
        autorUid: usuario.uid,
        autorNome: usuario.displayName,
        autorFoto: usuario.photoURL || null, // Salva para o card renderizar rápido
        data: serverTimestamp(), // Raiz do documento para o orderBy funcionar
        curtidas: [],
        visualizacoes: 0
      });
      setNovoPost('');
    } catch (err) {
      console.error("Erro ao enviar:", err);
    }
  }

  if (!comu) return <div style={{textAlign:'center', padding:'50px'}}>Carregando...</div>;

  const MenuMobile = () => (
    <div style={menuMobileContainer}>
      {['feed', 'sobre', 'membros'].map(aba => (
        <button 
          key={aba} 
          onClick={() => setAbaAtiva(aba)}
          style={abaAtiva === aba ? btnAbaAtiva : btnAbaInativa}
        >
          <span style={{fontSize: '18px'}}>{aba === 'feed' ? '📰' : aba === 'sobre' ? 'ℹ️' : '👥'}</span>
          <span style={{fontSize: '11px', fontWeight: 'bold'}}>{aba.charAt(0).toUpperCase() + aba.slice(1)}</span>
        </button>
      ))}
      {comu.criadoPor === usuario?.uid && (
        <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAbaInativa}>
          <span>⚙️</span><span style={{fontSize: '11px'}}>Adm</span>
        </button>
      )}
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

        <main style={{ flex: 1, maxWidth: isMobile ? '100%' : '650px' }}>
          {isMobile && <MenuMobile />}

          {abaAtiva === 'feed' && (
            <>
              <div style={cardBrancoPostar}>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <AvatarAutor uid={usuario?.uid} tamanho="45px" />
                  <div style={{ flex: 1 }}>
                    <textarea 
                      placeholder={`No que está pensando, ${usuario?.displayName?.split(' ')[0]}?`}
                      value={novoPost}
                      onChange={(e) => setNovoPost(e.target.value)}
                      style={{ ...inputTextArea, color: novoPost.length > LIMITE_POST ? 'red' : '#1a1a1a' }}
                    />
                  </div>
                </div>
                <div style={{ textAlign: 'right', marginTop: '12px' }}>
                  <button onClick={enviarPost} disabled={!novoPost.trim()} style={btnVerde}>Postar</button>
                </div>
              </div>
              {posts.map(p => (
                <CardPostComunidade key={p.id} p={p} usuario={usuario} slugComu={id} />
              ))}
            </>
          )}

          {abaAtiva === 'sobre' && (
            <div style={cardBranco}>
              <h2 style={tituloComu}>Sobre</h2>
              <p style={descText}>{comu.descricao || "Sem descrição disponível."}</p>
            </div>
          )}

          {abaAtiva === 'membros' && (
            <div style={cardBranco}>
              <h2 style={tituloComu}>Membros</h2>
              <div style={gridMembros}>
                <AvatarAutor uid={usuario?.uid} tamanho="50px" />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- ESTILOS ---
const containerBanner = { maxWidth: '1280px', margin: '0 auto', padding: '0 15px', position: 'relative' };
const bannerEstilo = (bg) => ({ height: '220px', background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, position: 'relative', borderRadius: '0 0 25px 25px', marginTop: '10px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', display: 'flex', justifyContent: 'center' });
const avatarFlutuanteDesktop = { width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-50px', left: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', zIndex: 10, border: '4px solid white' };
const avatarFlutuanteMobile = { width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', boxShadow: '0 8px 20px rgba(0,0,0,0.15)', zIndex: 10, border: '4px solid white' };
const layoutDesktop = { display: 'flex', justifyContent: 'center', marginTop: '70px', gap: '25px', maxWidth: '1280px', padding: '0 20px' };
const layoutMobile = { display: 'flex', flexDirection: 'column', padding: '70px 0 20px', gap: '10px' };
const cardBranco = { background: 'white', padding: '20px', borderRadius: '25px', border: '1px solid #ddd' };
const cardBrancoCentrado = { ...cardBranco, textAlign: 'center' };
const cardBrancoPostar = { ...cardBranco, borderRadius: '20px', marginBottom: '10px', padding: '15px', border: '1px solid #e1e8ed', margin: '0 10px' };
const tituloComu = { fontSize: '22px', fontWeight: '900', margin: '10px 0', color: '#1a1a1a' };
const badgeCat = { background: '#eef2ff', color: '#5865f2', padding: '4px 12px', borderRadius: '15px', fontSize: '12px', fontWeight: 'bold' };
const descText = { color: '#666', fontSize: '14px', margin: '10px 0' };
const inputTextArea = { width: '100%', border: 'none', outline: 'none', fontSize: '16px', resize: 'none', minHeight: '50px', background: '#fff', fontFamily: 'inherit' };
const btnVerde = { background: '#00a859', color: 'white', border: 'none', padding: '8px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnAmarelo = { width: '100%', padding: '10px', background: '#FFD700', border: 'none', borderRadius: '12px', fontWeight: '900', marginTop: '10px', cursor: 'pointer' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(60px, 1fr))', gap: '15px', marginTop: '15px' };
const menuMobileContainer = { display: 'flex', background: 'white', borderBottom: '1px solid #eee', position: 'sticky', top: 0, zIndex: 100 };
const btnAba = { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '10px 0', background: 'none', border: 'none', color: '#555' };
const btnAbaInativa = { ...btnAba };
const btnAbaAtiva = { ...btnAba, color: '#002776', borderBottom: '3px solid #002776', background: '#f8faff' };

export default PaginaComunidade;