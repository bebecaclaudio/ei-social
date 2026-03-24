import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp 
} from 'firebase/firestore';

// Importando o componente de post individual
import CardPostComunidade from './CardPostComunidade';

function PaginaComunidade({ usuario }) {
  const { id } = useParams(); // Pega o slug da URL (ex: monarquistas-brasileiros)
  const navigate = useNavigate();
  
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [larguraJanela, setLarguraJanela] = useState(window.innerWidth);

  // 1. Lógica Responsiva (Detecta redimensionamento)
  useEffect(() => {
    const handleResize = () => setLarguraJanela(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = larguraJanela <= 992; // Define o layout compacto para tablet/mobile

  // 2. Busca dados da Comunidade no Firebase (Baseado no slug da URL)
  useEffect(() => {
    const qComu = query(collection(db, "comunidades"), where("slug", "==", id));
    const unsubComu = onSnapshot(qComu, (snapshot) => {
      if (!snapshot.empty) {
        setComu({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() });
      }
    });
    return () => unsubComu();
  }, [id]);

  // 3. Busca os posts desta comunidade em tempo real
  useEffect(() => {
    if (!comu?.id) return;
    const qPosts = query(
      collection(db, "posts_comunidades"), 
      where("comunidadeId", "==", comu.id), 
      orderBy("data", "desc")
    );
    const unsubPosts = onSnapshot(qPosts, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsubPosts();
  }, [comu?.id]);

  // 4. Função para criar um novo post
  async function enviarPost() {
    if (!novoPost.trim() || !comu?.id || !usuario?.uid) return;
    setEnviando(true);
    try {
      await addDoc(collection(db, "posts_comunidades"), {
        comunidadeId: comu.id,
        comunidadeSlug: comu.slug,
        comunidadeNome: comu.nome,
        autorUid: usuario.uid,
        autorNome: usuario.displayName || "Membro",
        autorFoto: usuario.photoURL || "",
        texto: novoPost,
        data: serverTimestamp(),
        curtidas: [],
        visualizacoes: 0,
        comentariosCount: 0
      });
      setNovoPost('');
    } catch (err) {
      console.error("Erro ao postar:", err);
    } finally {
      setEnviando(false);
    }
  }

  if (!comu) return <div style={msgCarregando}>Conectando à Pleiadians...</div>;

  return (
    <div style={bgPagina}>
      {/* BANNER DINÂMICO (Usa a capaUrl ou a cor salva no banco) */}
      <div style={bannerStyle(comu.capaUrl || '#002776')}>
        <div style={avatarCapaWrapper}>
          {comu.emoji || '✨'}
        </div>
      </div>

      <div style={isMobile ? layoutMobile : layoutDesktop}>
        
        {/* COLUNA ESQUERDA: INFORMAÇÕES (Esconde no mobile compacto) */}
        {!isMobile && (
          <aside style={{ flex: 1 }}>
            <div style={cardInfo}>
              <h2 style={tituloComu}>{comu.nome}</h2>
              <span style={badgeCategoria}>{comu.categoria || 'Geral'}</span>
              <p style={textoDescritivo}>{comu.descricao}</p>
              
              {comu.criadoPor === usuario?.uid && (
                <button 
                  onClick={() => navigate(`/comunidades/${id}/gerenciar`)} 
                  style={btnAmarelo}
                >
                  ⚙️ Gerenciar Comunidade
                </button>
              )}
            </div>
          </aside>
        )}

        {/* COLUNA CENTRAL: FEED DE POSTS */}
        <main style={{ flex: isMobile ? '1 1 100%' : 2 }}>
          
          {/* Título aparece aqui apenas no Mobile Compacto */}
          {isMobile && (
            <div style={{ marginBottom: '15px', padding: '0 5px' }}>
              <h2 style={{ margin: 0, fontWeight: '900' }}>{comu.nome}</h2>
              <small style={{ color: '#666' }}>{comu.categoria}</small>
            </div>
          )}

          {/* CAIXA DE POSTAGEM */}
          <div style={cardInput}>
            <div style={{ display: 'flex', gap: '12px' }}>
              <img src={usuario?.photoURL} style={avatarMini} alt="" />
              <textarea 
                placeholder={`O que há de novo na ${comu.nome}?`}
                value={novoPost} 
                onChange={(e) => setNovoPost(e.target.value)} 
                style={inputTextArea}
              />
            </div>
            <div style={{ textAlign: 'right', marginTop: '10px' }}>
              <button 
                onClick={enviarPost} 
                disabled={enviando || !novoPost.trim()} 
                style={btnPostarVerde}
              >
                {enviando ? '...' : 'Postar'}
              </button>
            </div>
          </div>

          {/* LISTA DE POSTS (Mapeando o componente individual) */}
          {posts.map((p) => (
            <CardPostComunidade 
              key={p.id} 
              p={p} 
              usuario={usuario} 
              nomeComu={comu.nome} 
              slugComu={comu.slug} 
            />
          ))}
        </main>

        {/* COLUNA DIREITA: MEMBROS (Esconde no mobile compacto) */}
        {!isMobile && (
          <aside style={{ flex: 1 }}>
            <div style={cardInfo}>
              <h4 style={tituloMembros}>Membros</h4>
              <div style={listaMembros}>
                <img src={usuario?.photoURL} style={avatarMembro} title="Você" alt="" />
              </div>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

// --- ESTILOS (SISTEMA DE DESIGN PLEIADIANS) ---
const bgPagina = { backgroundColor: '#f0f2f5', minHeight: '100vh', paddingBottom: '80px' };

const bannerStyle = (bg) => ({ 
  height: '260px', 
  background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, 
  position: 'relative',
  borderRadius: '0 0 20px 20px'
});

const avatarCapaWrapper = { 
  width: '100px', height: '100px', background: 'white', borderRadius: '25px', 
  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', 
  position: 'absolute', bottom: '-50px', left: '8%', 
  boxShadow: '0 4px 15px rgba(0,0,0,0.1)' 
};

const layoutDesktop = { display: 'flex', maxWidth: '1250px', margin: '70px auto 0', gap: '20px', padding: '0 20px' };
const layoutMobile = { display: 'flex', flexDirection: 'column', padding: '70px 15px 0', gap: '15px' };

const cardInfo = { background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #f0f0f0', textAlign: 'center' };
const tituloComu = { fontSize: '24px', fontWeight: '900', color: '#0f1419', marginBottom: '8px' };
const badgeCategoria = { background: '#eef2ff', color: '#5865f2', padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 'bold' };
const textoDescritivo = { color: '#536471', marginTop: '15px', fontSize: '14px', lineHeight: '1.6' };

const btnAmarelo = { width: '100%', marginTop: '20px', padding: '12px', borderRadius: '12px', background: '#FFD700', border: 'none', fontWeight: '900', cursor: 'pointer' };
const btnPostarVerde = { background: '#00a859', color: 'white', border: 'none', padding: '10px 25px', borderRadius: '15px', fontWeight: 'bold', cursor: 'pointer' };

const cardInput = { background: 'white', padding: '20px', borderRadius: '20px', marginBottom: '15px', border: '1px solid #f0f0f0' };
const inputTextArea = { width: '100%', border: 'none', outline: 'none', fontSize: '17px', resize: 'none', minHeight: '50px' };
const avatarMini = { width: '45px', height: '45px', borderRadius: '50%' };

const tituloMembros = { color: '#888', fontWeight: 'bold', fontSize: '14px', marginBottom: '15px' };
const listaMembros = { display: 'flex', gap: '8px', justifyContent: 'center' };
const avatarMembro = { width: '35px', height: '35px', borderRadius: '50%', border: '2px solid #00a859' };

const msgCarregando = { textAlign: 'center', padding: '100px', fontWeight: '900', color: '#002776', fontSize: '20px' };

export default PaginaComunidade;