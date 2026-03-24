import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from './firebase-config';
import { 
  collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, 
  doc, getDoc, limit, startAfter, getDocs 
} from 'firebase/firestore';
import CardPostComunidade from './CardPostComunidade';

// --- COMPONENTE AUXILIAR: AvatarAutor (Bolinha de foto) ---
function AvatarAutor({ uid, tamanho = '42px' }) {
  const [foto, setFoto] = useState(null);
  useEffect(() => {
    if (!uid) return;
    getDoc(doc(db, "usuarios", uid)).then(d => d.exists() && setFoto(d.data().foto));
  }, [uid]);

  return (
    <div style={{ 
      width: tamanho, height: tamanho, borderRadius: '50%', 
      overflow: 'hidden', background: '#f0f2f5', flexShrink: 0, border: '1px solid #ddd' 
    }}>
      <img 
        src={foto || `https://ui-avatars.com/api/?name=U&background=random`} 
        alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
      />
    </div>
  );
}

function PaginaComunidade({ usuario }) {
  const { id } = useParams();
  const navigate = useNavigate();
  
  // --- ESTADOS ---
  const [comu, setComu] = useState(null);
  const [posts, setPosts] = useState([]);
  const [novoPost, setNovoPost] = useState('');
  const [abaAtiva, setAbaAtiva] = useState('posts'); // Padrão: 'posts'
  const [largura, setLargura] = useState(window.innerWidth);

  // --- MEMBROS (INFINITE SCROLL) ---
  const [membros, setMembros] = useState([]);
  const [ultimoDoc, setUltimoDoc] = useState(null);
  const [carregandoMembros, setCarregandoMembros] = useState(false);
  const [temMaisMembros, setTemMaisMembros] = useState(true);
  const sensorScroll = useRef();

  // --- CONTROLE DE RESPONSIVIDADE ---
  useEffect(() => {
    const handleResize = () => setLargura(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isMobile = largura <= 992;

  // 1. DADOS DA COMUNIDADE
  useEffect(() => {
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    return onSnapshot(q, (snap) => {
      if (!snap.empty) setComu({ id: snap.docs[0].id, ...snap.docs[0].data() });
    });
  }, [id]);

  // 2. POSTS REAL-TIME
  useEffect(() => {
    if (!comu?.id) return;
    const q = query(collection(db, "posts_comunidades"), where("comunidadeId", "==", comu.id), orderBy("data", "desc"));
    return onSnapshot(q, (snap) => {
      setPosts(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
  }, [comu?.id]);

  // 3. INFINITE SCROLL MEMBROS
  const carregarMembros = async () => {
    if (carregandoMembros || !temMaisMembros || !comu?.id) return;
    setCarregandoMembros(true);
    try {
      const q = query(collection(db, "usuarios"), where("comunidadesSeguidas", "array-contains", comu.id), orderBy("nome"), limit(9), ...(ultimoDoc ? [startAfter(ultimoDoc)] : []));
      const snap = await getDocs(q);
      if (snap.empty) setTemMaisMembros(false);
      else {
        setMembros(prev => [...prev, ...snap.docs.map(d => ({ id: d.id, ...d.data() }))]);
        setUltimoDoc(snap.docs[snap.docs.length - 1]);
      }
    } catch (e) { console.error(e); }
    setCarregandoMembros(false);
  };

  useEffect(() => {
    const obs = new IntersectionObserver((ent) => { if (ent[0].isIntersecting && temMaisMembros) carregarMembros(); });
    if (sensorScroll.current) obs.observe(sensorScroll.current);
    return () => obs.disconnect();
  }, [ultimoDoc, temMaisMembros, comu?.id]);

  async function enviarPost() {
    if (!novoPost.trim() || !usuario) return;
    await addDoc(collection(db, "posts_comunidades"), {
      comunidadeId: comu.id, texto: novoPost, autorUid: usuario.uid,
      autorNome: usuario.displayName, autorFoto: usuario.photoURL,
      data: serverTimestamp(), curtidas: [], salvosPor: [], visualizacoes: 0
    });
    setNovoPost('');
  }

  if (!comu) return <div style={{textAlign: 'center', padding: '100px'}}>Sincronizando Pleiades...</div>;
  const souDono = comu.criadoPor === usuario?.uid;

  return (
    <div style={{ background: '#f0f2f5', minHeight: '100vh', paddingBottom: '50px' }}>
      
      {/* 1. BANNER (PROPORCIONAL) */}
      <div style={containerBanner}>
        <div style={estiloBanner(comu.capaUrl || '#002776')}>
          <div style={avatarDinamico(isMobile)}>{comu.emoji || '✨'}</div>
        </div>
      </div>

      {/* 2. NAV ABAS (4 OPÇÕES - MOBILE) */}
      {isMobile && (
        <div style={barraAbasMobile}>
          <button onClick={() => setAbaAtiva('posts')} style={abaAtiva === 'posts' ? abaOn : abaOff}>Posts</button>
          <button onClick={() => setAbaAtiva('descricao')} style={abaAtiva === 'descricao' ? abaOn : abaOff}>Descrição</button>
          <button onClick={() => setAbaAtiva('membros')} style={abaAtiva === 'membros' ? abaOn : abaOff}>Membros</button>
          {(souDono || usuario?.regra === 'moderador') && (
            <button onClick={() => setAbaAtiva('administracao')} style={abaAtiva === 'administracao' ? abaOn : abaOff}>Administração</button>
          )}
        </div>
      )}

      {/* 3. GRID MESTRE (3 COLUNAS - DESKTOP) */}
      <div style={gridMestre}>
        
        {/* COLUNA 1: DESCRIÇÃO (Desktop sempre, Mobile aba Descrição) */}
        {(!isMobile || abaAtiva === 'descricao') && (
          <aside style={isMobile ? fullWidth : colEsq}>
            <div style={cardInfo}>
              <h1 style={nomeComu}>{comu.nome}</h1>
              <span style={catBadge}>{comu.categoria}</span>
              <div style={divisor} />
              <p style={descText}>{comu.descricao}</p>
            </div>
          </aside>
        )}

        {/* COLUNA 2: FEED (Desktop sempre, Mobile aba Posts) */}
        {(!isMobile || abaAtiva === 'posts') && (
          <main style={colCentro(isMobile)}>
            <div style={cardPostar}>
              <div style={{display: 'flex', gap: '15px', alignItems: 'flex-start'}}>
                <AvatarAutor uid={usuario?.uid} />
                <textarea 
                  value={novoPost} onChange={e => setNovoPost(e.target.value)} 
                  placeholder="O que você está concatenando?" style={inputArea} 
                />
              </div>
              <div style={{textAlign: 'right'}}><button onClick={enviarPost} style={btnPostVerde}>Postar</button></div>
            </div>
            {posts.map(p => <CardPostComunidade key={p.id} p={p} usuario={usuario} slugComu={id} />)}
          </main>
        )}

        {/* COLUNA 3: MEMBROS & ADM (Desktop sempre, Mobile abas Membros/Adm) */}
        {(!isMobile || abaAtiva === 'membros' || abaAtiva === 'administracao') && (
          <aside style={isMobile ? fullWidth : colDir}>
            
            {/* SEÇÃO MEMBROS (Sempre Desktop, Mobile aba Membros) */}
            {(!isMobile || abaAtiva === 'membros') && (
              <div style={cardInfo}>
                <h4 style={subTitulo}>Membros</h4>
                <div style={gridMembros}>
                  {membros.map(m => <AvatarAutor key={m.id} uid={m.id} tamanho="42px" />)}
                  {temMaisMembros && <button onClick={carregarMembros} style={btnMaisMembros}>+</button>}
                </div>
              </div>
            )}

            {/* SEÇÃO ADM (Sempre Desktop se dono, Mobile aba Adm) */}
            {((!isMobile && souDono) || (isMobile && abaAtiva === 'administracao')) && (
              <div style={{...cardInfo, marginTop: '20px'}}>
                <h4 style={subTitulo}>Administração</h4>
                <button onClick={() => navigate(`/comunidades/${id}/gerenciar`)} style={btnAdmAmarelo}>
                  ⚙️ Editar Informações
                </button>
              </div>
            )}
          </aside>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS ---
const containerBanner = { maxWidth: '1200px', margin: '0 auto', position: 'relative' };
const estiloBanner = (bg) => ({ height: '220px', background: bg.startsWith('http') ? `url(${bg}) center/cover` : bg, borderRadius: '0 0 25px 25px' });
const avatarDinamico = (mob) => ({ width: '100px', height: '100px', background: 'white', borderRadius: '25px', position: 'absolute', bottom: '-50px', left: mob ? '50%' : '30px', marginLeft: mob ? '-50px' : '0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px', border: '4px solid white', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', zIndex: 10 });
const gridMestre = { display: 'flex', justifyContent: 'center', gap: '20px', padding: '0 15px', maxWidth: '1200px', margin: '60px auto 0' };
const colEsq = { width: '300px', position: 'sticky', top: '20px', alignSelf: 'flex-start' };
const colDir = { width: '280px', position: 'sticky', top: '20px', alignSelf: 'flex-start' };
const colCentro = (mob) => ({ flex: 1, maxWidth: mob ? '100%' : '600px' });
const fullWidth = { width: '100%' };
const cardInfo = { background: 'white', padding: '20px', borderRadius: '22px', border: '1px solid #e1e8ed' };
const nomeComu = { fontSize: '24px', fontWeight: '900', color: '#1a1a1a', margin: '0 0 5px' };
const catBadge = { background: '#eef2ff', color: '#5865f2', padding: '5px 12px', borderRadius: '10px', fontSize: '12px', fontWeight: 'bold', display: 'inline-block', marginBottom: '15px' };
const divisor = { height: '1px', background: '#f0f2f5', margin: '15px 0' };
const descText = { color: '#444', lineHeight: '1.6', fontSize: '14px' };
const subTitulo = { color: '#888', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', marginBottom: '15px' };
const cardPostar = { background: 'white', padding: '15px', borderRadius: '20px', border: '1px solid #e1e8ed', marginBottom: '20px' };
const inputArea = { width: '100%', border: 'none', outline: 'none', minHeight: '60px', fontSize: '17px', resize: 'none' };
const btnPostVerde = { background: '#00a859', color: 'white', border: 'none', padding: '8px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnAdmAmarelo = { width: '100%', padding: '12px', background: '#FFD700', border: 'none', borderRadius: '10px', fontWeight: '900', marginTop: '10px', color: '#000', cursor: 'pointer' };
const barraAbasMobile = { display: 'flex', background: 'white', borderBottom: '1px solid #ddd', marginTop: '60px', position: 'sticky', top: 0, zIndex: 100 };
const abaOn = { flex: 1, padding: '15px', border: 'none', background: 'none', color: '#00a859', borderBottom: '3px solid #00a859', fontWeight: 'bold', fontSize: '14px' };
const abaOff = { flex: 1, padding: '15px', border: 'none', background: 'none', color: '#888', fontSize: '14px' };
const gridMembros = { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }; // Grid de 3x3 (9 membros)
const btnMaisMembros = { width: '42px', height: '42px', borderRadius: '50%', background: '#f0f2f5', border: '1px solid #ddd', color: '#666', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' };

export default PaginaComunidade;