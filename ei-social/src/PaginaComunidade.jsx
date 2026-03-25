import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc 
} from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

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
  // Pegamos o slug da URL (que no App.js está como :slug)
  const { slug } = useParams(); 
  const navigate = useNavigate();
  
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [largura, setLargura] = useState(window.innerWidth);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const handleResize = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = largura <= 992;

  // 1. BUSCA DA COMUNIDADE POR SLUG
  useEffect(() => {
    if (!slug) return;
    setCarregando(true);

    const q = query(collection(db, "comunidades"), where("slug", "==", slug));
    const unsub = onSnapshot(q, async (snap) => {
      if (!snap.empty) {
        setComu({ id: snap.docs[0].id, ...snap.docs[0].data() });
        setCarregando(false);
      } else {
        // Fallback para IDs antigos se não achar o slug
        const docRef = doc(db, "comunidades", slug);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setComu({ id: docSnap.id, ...docSnap.data() });
        }
        setCarregando(false);
      }
    });
    return () => unsub();
  }, [slug]);

  // 2. BUSCA DOS POSTS
  useEffect(() => {
    if (!comu?.id) return;
    
    const q = query(
      collection(db, "posts_comunidade"), 
      where("comunidadeId", "==", comu.id),
      orderBy("data", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const lista = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setPosts(lista);
    }, (error) => {
       console.error("Erro ao carregar posts:", error);
    });

    return () => unsub();
  }, [comu?.id]);

  // 3. ENVIO DO POST
  async function enviarPost() {
    if (!novoPost.trim() || novoPost.length > 5000 || !usuario || !comu) return;
    try {
      await addDoc(collection(db, "posts_comunidade"), {
        comunidadeId: comu.id, 
        texto: novoPost,
        autorUid: usuario.uid, 
        autorNome: usuario.displayName || "Usuário",
        data: serverTimestamp(), 
        curtidas: [], 
        visualizacoes: 0
      });
      setNovoPost('');
    } catch (e) {
      console.error("Erro ao postar:", e);
    }
  }

  if (carregando) return <div style={{padding: '20px', textAlign: 'center', color: '#666'}}>Carregando comunidade...</div>;
  if (!comu) return <div style={{padding: '20px', textAlign: 'center'}}>Comunidade não encontrada.</div>;

  const souDono = comu.criadoPor === usuario?.uid;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: '30px' }}>
      
      <div style={containerBannerGeral}>
        <div style={estiloBanner(comu.capaUrl || '#002663')}>
          <div style={avatarTopoEsquerdo}>{comu.emoji || '✨'}</div>
        </div>
      </div>

      <div style={gridMestre(isMobile)}>
        {/* SIDEBAR ESQUERDA */}
        <aside style={isMobile ? fullWidth : colLateral}>
          <div style={cardBranco}>
            <h1 style={tituloPretoSidebar}>{comu.nome}</h1>
            <span style={badgeCategoriaAzulClaro}>{comu.categoria}</span>
            <p style={textoDescAproximado}>{comu.descricao || "Bem-vinda à nossa egrégora."}</p>
            
            {souDono && (
              <button onClick={() => navigate(`/comunidades/${slug}/gerenciar`)} style={btnGerenciarAmarelo}>
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
              </div>
            </div>
            
            <div style={botoesAcaoPost}>
              <div style={grupoEsquerdaAcao}>
                <span style={textosEscuros}>{novoPost.length}/5000</span>
                <button onClick={() => alert("Salvo!")} style={btnRascunho}>Salvar rascunho</button>
              </div>
              <button onClick={enviarPost} style={btnPostVerde}>Postar</button>
            </div>
          </div>

          {posts.length === 0 ? (
            <p style={{textAlign: 'center', color: '#888', marginTop: '20px'}}>Nenhum post nesta comunidade ainda.</p>
          ) : (
            posts.map(p => <CardPostComunidade key={p.id} p={p} usuario={usuario} slugComu={slug} />)
          )}
        </main>

        {/* SIDEBAR DIREITA */}
        {!isMobile && (
          <aside style={colLateral}>
            <div style={cardBranco}>
              <h4 style={tituloPretoMembros}>MEMBROS</h4>
              <div style={divisorPequeno} />
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

// --- SEUS ESTILOS ORIGINAIS (SEM ALTERAÇÃO) ---
const containerBannerGeral = { maxWidth: '1150px', margin: '0 auto', padding: '20px 20px 0', position: 'relative' };
const estiloBanner = (bg) => ({ height: '220px', background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, borderRadius: '20px', position: 'relative' });
const avatarTopoEsquerdo = { width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-40px', left: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', border: '4px solid white', zIndex: 10 };
const gridMestre = (mob) => ({ display: 'flex', flexDirection: mob ? 'column' : 'row', justifyContent: 'center', gap: '20px', padding: '0 20px', maxWidth: '1150px', margin: '60px auto 0' });
const colLateral = { width: '280px', position: 'sticky', top: '20px', alignSelf: 'flex-start' };
const colCentro = (mob) => ({ flex: 1, maxWidth: mob ? '100%' : '520px' });
const fullWidth = { width: '100%' };
const cardBranco = { background: 'white', padding: '20px', borderRadius: '20px', border: '1px solid #e1e8ed' };
const tituloPretoSidebar = { fontSize: '22px', fontWeight: '900', color: '#000', margin: '0 0 10px', lineHeight: '1.2' };
const tituloPretoMembros = { fontSize: '18px', fontWeight: '900', color: '#000', margin: '0' };
const badgeCategoriaAzulClaro = { background: '#e0f7fa', color: '#002663', fontSize: '12px', fontWeight: 'bold', padding: '5px 12px', borderRadius: '15px', display: 'inline-block', marginBottom: '8px' };
const divisorPequeno = { height: '1px', background: '#f0f2f5', margin: '10px 0' };
const textoDescAproximado = { fontSize: '14px', color: '#555', marginTop: '5px', lineHeight: '1.4' };
const cardPostar = { background: 'white', padding: '18px', borderRadius: '22px', border: '1px solid #e1e8ed', marginBottom: '20px' };
const inputAreaAjustado = { width: '100%', boxSizing: 'border-box', border: 'none', background: '#f8f9fa', borderRadius: '12px', minHeight: '90px', padding: '15px', outline: 'none', resize: 'none', fontSize: '16px', color: '#1a1a1a' };
const botoesAcaoPost = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '15px' };
const grupoEsquerdaAcao = { display: 'flex', alignItems: 'center', gap: '15px' };
const textosEscuros = { fontSize: '11px', color: '#444', fontWeight: 'bold' };
const btnRascunho = { background: 'none', border: 'none', color: '#444', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' };
const btnPostVerde = { background: '#00a859', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnGerenciarAmarelo = { width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '12px', fontWeight: 'bold', marginTop: '20px', color: '#000', cursor: 'pointer' };
const gridMembros = { display: 'flex', gap: '8px', justifyContent: 'flex-start', marginTop: '15px' };
const btnMais = { width: '40px', height: '40px', borderRadius: '50%', border: 'none', background: '#eee' };

export default PaginaComunidade;