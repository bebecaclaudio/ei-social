import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, 
  doc, getDoc, limit, startAfter, getDocs 
} from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

// --- COMPONENTE: AvatarMembro ---
// Mantém o estilo visual dos membros consistente
function AvatarMembro({ uid, tamanho = '48px' }) {
  const [dados, setDados] = useState(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "usuarios", uid)).then(d => d.exists() && setDados(d.data()));
  }, [uid]);

  return (
    <div title={dados?.nome || "Membro"} style={{ 
      width: tamanho, height: tamanho, borderRadius: '14px', 
      overflow: 'hidden', background: '#e1e8ed', flexShrink: 0, border: '1px solid #ddd' 
    }}>
      <img 
        src={dados?.foto || `https://ui-avatars.com/api/?name=U&background=random`} 
        alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    </div>
  );
}

function PaginaComunidade({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- ESTADOS DE LAYOUT E CONTEÚDO ---
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('feed');
  const [largura, setLargura] = useState(window.innerWidth);

  // --- ESTADOS DE MEMBROS (INFINITE SCROLL) ---
  const [membros, setMembros] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [temMaisMembros, setTemMaisMembros] = useState(true);
  const sensorScroll = useRef(); // O "olho" que detecta o fim da lista

  // --- CONTROLE DE RESPONSIVIDADE (SEM QUEBRAS) ---
  useEffect(() => {
    const handleResize = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = largura <= 992;

  // 1. CARREGAR DADOS DA COMUNIDADE
  useEffect(() => {
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setComu({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, [id]);

  // 2. CARREGAR POSTS (FEED REAL-TIME)
  useEffect(() => {
    if (!comu?.id) return;
    const q = query(collection(db, "posts_comunidades"), where("comunidadeId", "==", comu.id), orderBy("data", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [comu?.id]);

  // 3. FUNÇÃO DE CARREGAMENTO DE MEMBROS (PAGINADA)
  const carregarMembros = async () => {
    if (carregandoMembros || !temMaisMembros || !comu?.id) return;
    
    setCarregandoMembros(true);
    try {
      const membrosRef = collection(db, "usuarios");
      let q = query(
        membrosRef, 
        where("comunidadesSeguidas", "array-contains", comu.id),
        orderBy("nome"),
        limit(12) // Carrega de 12 em 12 para manter o grid bonito
      );

      if (ultimoDoc) q = query(q, startAfter(ultimoDoc));

      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        setTemMaisMembros(false);
      } else {
        const novos = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        setMembros(prev => [...prev, ...novos]);
        setUltimoDoc(snapshot.docs[snapshot.docs.length - 1]);
      }
    } catch (e) { console.error("Erro membros:", e); }
    setCarregandoMembros(false);
  };

  // 4. OBSERVER (SÓ ATIVA QUANDO NECESSÁRIO)
  useEffect(() => {
    // Só observa se estiver na aba membros (mobile) ou sempre no desktop
    if (isMobile && abaAtiva !== 'membros') return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && temMaisMembros) carregarMembros();
    }, { threshold: 0.1 });

    if (sensorScroll.current) observer.observe(sensorScroll.current);
    return () => observer.disconnect();
  }, [abaAtiva, ultimoDoc, comu?.id, isMobile]);

  // Enviar Post
  async function enviarPost() {
    if (!novoPost.trim() || !usuario) return;
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id, texto: novoPost, autorUid: usuario.uid,
      autorNome: usuario.displayName, autorFoto: usuario.photoURL || null,
      data: serverTimestamp(), curtidas: [], visualizacoes: 0
    });
    setNovoPost('');
  }

  if (!comu) return <div style={msgAviso}>Sincronizando Pleiadians...</div>;
  const souDono = comu.criadoPor === usuario?.uid;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', fontFamily: 'Inter, sans-serif' }}>
      
      {/* HEADER / BANNER */}
      <div style={containerBanner}>
        <div style={estiloBanner(comu.capaUrl || '#002776')}>
          <div style={avatarFixo}>{comu.emoji || '✨'}</div>
        </div>
      </div>

      {/* NAV ABAS (MOBILE) */}
      {isMobile && (
        <div style={barraAbas}>
          <button onClick={() => setAbaAtiva('feed')} style={abaAtiva === 'feed' ? abaOn : abaOff}>FEED</button>
          <button onClick={() => setAbaAtiva('sobre')} style={abaAtiva === 'sobre' ? abaOn : abaOff}>SOBRE</button>
          <button onClick={() => setAbaAtiva('membros')} style={abaAtiva === 'membros' ? abaOn : abaOff}>MEMBROS</button>
          {souDono && <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={abaOff}>⚙️</button>}
        </div>
      )}

      {/* GRID PRINCIPAL (3 COLUNAS NO DESKTOP) */}
      <div style={gridMaster}>
        
        {/* COLUNA 1: SOBRE */}
        {(!isMobile || abaAtiva === 'sobre') && (
          <aside style={isMobile ? mobWidth : colEsq}>
            <div style={cardInfo}>
              <h1 style={nomeComu}>{comu.nome}</h1>
              <span style={catBadge}>{comu.categoria}</span>
              <div style={divisor} />
              <p style={descText}>{comu.descricao || "Fragmentos de uma nova era."}</p>
              {souDono && !isMobile && (
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAdm}>Painel Admin</button>
              )}
            </div>
          </aside>
        )}

        {/* COLUNA 2: FEED */}
        {(!isMobile || abaAtiva === 'feed') && (
          <main style={colCentro(isMobile)}>
            <div style={cardPostar}>
              <textarea 
                value={novoPost} onChange={e => setNovoPost(e.target.value)}
                placeholder="O que você está concatenando?" style={inputArea}
              />
              <div style={{textAlign: 'right'}}><button onClick={enviarPost} style={btnPost}>Postar</button></div>
            </div>
            {posts.map(p => <CardPostComunidade key={p.id} p={p} usuario={usuario} slugComu={id} />)}
          </main>
        )}

        {/* COLUNA 3: MEMBROS (INFINITE) */}
        {(!isMobile || abaAtiva === 'membros') && (
          <aside style={isMobile ? mobWidth : colDir}>
            <div style={cardInfo}>
              <h4 style={subTitulo}>Egrégora</h4>
              <div style={gridMembros}>
                {membros.map(m => <AvatarMembro key={m.id} uid={m.id} />)}
              </div>
              
              {/* SENSOR DE SCROLL INFINITO */}
              <div ref={sensorScroll} style={areaSensor}>
                {carregandoMembros && <div className="spinner">...</div>}
                {!temMaisMembros && membros.length > 0 && <span style={fimLista}>Círculo completo</span>}
              </div>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS À PROVA DE ERRO ---
const containerBanner = { maxWidth: '1200px', margin: '0 auto', position: 'relative' };
const estiloBanner = (bg) => ({ height: '230px', background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, borderRadius: '0 0 30px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' });
const avatarFixo = { width: '100px', height: '100px', background: 'white', borderRadius: '28px', position: 'absolute', bottom: '-50px', left: '50%', marginLeft: '-50px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', border: '5px solid white', boxShadow: '0 5px 15px rgba(0,0,0,0.1)' };
const gridMaster = { display: 'flex', justifyContent: 'center', gap: '25px', padding: '0 20px', maxWidth: '1240px', margin: '70px auto 0' };
const colEsq = { width: '320px', position: 'sticky', top: '20px', alignSelf: 'flex-start' };
const colDir = { width: '280px', position: 'sticky', top: '20px', alignSelf: 'flex-start' };
const colCentro = (mob) => ({ flex: 1, maxWidth: mob ? '100%' : '600px' });
const mobWidth = { width: '100%' };

const cardInfo = { background: 'white', padding: '25px', borderRadius: '24px', border: '1px solid #e1e8ed', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' };
const nomeComu = { fontSize: '24px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 10px' };
const catBadge = { background: '#eef2ff', color: '#5865f2', padding: '6px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 'bold' };
const divisor = { height: '1px', background: '#f0f2f5', margin: '20px 0' };
const descText = { color: '#444', lineHeight: '1.6', fontSize: '15px' };

const cardPostar = { background: 'white', padding: '20px', borderRadius: '24px', border: '1px solid #e1e8ed', marginBottom: '25px' };
const inputArea = { width: '100%', border: 'none', outline: 'none', minHeight: '80px', fontSize: '18px', color: '#1a1a1a', resize: 'none', background: '#fff' };
const btnPost = { background: '#00a859', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '14px', fontWeight: 'bold', cursor: 'pointer' };
const btnAdm = { width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '14px', fontWeight: 'bold', marginTop: '20px', color: '#000' };

const barraAbas = { display: 'flex', background: 'white', borderBottom: '1px solid #ddd', marginTop: '60px', position: 'sticky', top: 0, zIndex: 100 };
const abaOn = { flex: 1, padding: '18px', border: 'none', background: 'none', color: '#00a859', borderBottom: '4px solid #00a859', fontWeight: '900' };
const abaOff = { flex: 1, padding: '18px', border: 'none', background: 'none', color: '#888', fontWeight: 'bold' };

const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '10px' };
const subTitulo = { color: '#888', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' };
const areaSensor = { minHeight: '30px', textAlign: 'center', marginTop: '20px' };
const fimLista = { color: '#ccc', fontSize: '11px', fontWeight: 'bold' };
const msgAviso = { textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#666' };

export default PaginaComunidade;