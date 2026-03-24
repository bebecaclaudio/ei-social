import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import { Link } from 'react-router-dom';

// --- FORMATADOR DE DATA ESTILO X ---
const formatarDataTwitter = (dataFirestore) => {
  if (!dataFirestore) return '';
  const data = dataFirestore.toDate();
  const hora = data.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  const dataExtenso = data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' });
  return `${hora} · ${dataExtenso}`;
};

const CardPostComunidade = ({ p, usuario, nomeComu, slugComu }) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  // Fecha o menu suspenso se clicar fora dele
  useEffect(() => {
    const fecharMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuAberto(false);
      }
    };
    document.addEventListener('mousedown', fecharMenu);
    return () => document.removeEventListener('mousedown', fecharMenu);
  }, []);

  const toggleLike = async () => {
    if (!usuario) return;
    const ref = doc(db, "posts_comunidades", p.id);
    const jaCurtiu = p.curtidas?.includes(usuario.uid);
    await updateDoc(ref, { 
      curtidas: jaCurtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid) 
    });
  };

  const apagarPost = async () => {
    if (window.confirm("Deseja apagar este fragmento da comunidade?")) {
      await deleteDoc(doc(db, "posts_comunidades", p.id));
    }
  };

  return (
    <div style={cardEstilo}>
      {/* 1. NAVEGAÇÃO SUPERIOR (BREADCRUMBS) ✅ */}
      <div style={breadcrumbPost}>
        <Link to="/comunidades" style={linkBread}>Comunidades</Link>
        <span style={divisorBread}>/</span>
        <Link to={`/comunidades/${slugComu}`} style={linkBreadAtivo}>{slugComu}</Link>
      </div>

      {/* 2. HEADER DO AUTOR + MENU */}
      <div style={headerPost}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <img src={p.autorFoto || 'https://via.placeholder.com/45'} style={avatarMini} alt="" />
          <div>
            <strong style={nomeAutor}>{p.autorNome}</strong>
            <small style={dataPostEstilo}>{formatarDataTwitter(p.data)}</small>
          </div>
        </div>

        {/* MENU 3 BOLINHAS INDIVIDUAL */}
        <div style={{ position: 'relative' }} ref={menuRef}>
          <button onClick={() => setMenuAberto(!menuAberto)} style={btnDots}>•••</button>
          {menuAberto && (
            <div style={dropdownMenu}>
              <button onClick={() => alert("Editar...")} style={itemMenu}>✏️ Editar</button>
              <button onClick={() => alert("Salvo nos rascunhos")} style={itemMenu}>✍️ Salvar como Rascunho</button>
              {p.autorUid === usuario?.uid && (
                <button onClick={apagarPost} style={{ ...itemMenu, color: '#ff4b4b', borderBottom: 'none' }}>🗑️ Apagar</button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. CONTEÚDO DO POST (CLICÁVEL PARA URL ÚNICA) */}
      <Link to={`/post/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <p style={corpoTexto}>{p.texto}</p>
      </Link>

      {/* 4. BARRA DE INTERAÇÃO (FIEL AO DESIGN DO X) */}
      <div style={barraAcoes}>
        {/* CURTIDAS */}
        <button onClick={toggleLike} style={btnInteracao(p.curtidas?.includes(usuario?.uid), '#f91880')}>
          {p.curtidas?.includes(usuario?.uid) ? '❤️' : '🤍'} {p.curtidas?.length || 0}
        </button>

        {/* COMENTÁRIOS */}
        <Link to={`/post/${p.id}`} style={btnInteracao(false, '#1d9bf0')}>
          💬 {p.comentariosCount || 0}
        </Link>

        {/* REPOSTS */}
        <button style={btnInteracao(false, '#00ba7c')}>🔄</button>

        {/* ALCANCE / VISUALIZAÇÕES */}
        <button style={btnInteracao(false, '#536471')}>📊 {p.visualizacoes || 0}</button>

        {/* SALVAR & COMPARTILHAR */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button style={btnInteracao(false, '#ffd700')}>🔖</button>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/post/${p.id}`);
              alert("Link do fragmento copiado!");
            }} 
            style={btnInteracao(false, '#1d9bf0')}
          >
            🔗
          </button>
        </div>
      </div>
    </div>
  );
};

// --- SISTEMA DE ESTILOS (CSS-IN-JS) ---
const cardEstilo = { 
  background: 'white', 
  padding: '18px 20px', 
  borderRadius: '18px', 
  marginBottom: '15px', 
  border: '1px solid #f0f0f0', 
  boxShadow: '0 2px 5px rgba(0,0,0,0.02)',
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif'
};

const breadcrumbPost = { 
  fontSize: '11px', 
  marginBottom: '12px', 
  display: 'flex', 
  alignItems: 'center', 
  color: '#aaa', 
  fontWeight: 'bold', 
  textTransform: 'lowercase' 
};

const linkBread = { textDecoration: 'none', color: '#aaa' };
const divisorBread = { margin: '0 6px', fontWeight: 'normal' };
const linkBreadAtivo = { textDecoration: 'none', color: '#00a859' };

const headerPost = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const avatarMini = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' };
const nomeAutor = { display: 'block', fontSize: '15px', fontWeight: 'bold', color: '#0f1419' };
const dataPostEstilo = { color: '#536471', fontSize: '13px' };

const corpoTexto = { 
  margin: '12px 0', 
  fontSize: '15px', 
  lineHeight: '1.5', 
  color: '#0f1419', 
  whiteSpace: 'pre-wrap', 
  wordWrap: 'break-word' 
};

const barraAcoes = { 
  display: 'flex', 
  justifyContent: 'space-between', 
  borderTop: '1px solid #eff3f4', 
  paddingTop: '12px', 
  marginTop: '4px' 
};

const btnInteracao = (ativo, cor) => ({ 
  background: 'none', 
  border: 'none', 
  cursor: 'pointer', 
  color: ativo ? cor : '#536471', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '6px', 
  fontSize: '13px',
  textDecoration: 'none',
  transition: '0.2s ease'
});

const btnDots = { 
  background: 'none', 
  border: 'none', 
  cursor: 'pointer', 
  color: '#cfd9de', 
  fontSize: '18px', 
  padding: '5px' 
};

const dropdownMenu = { 
  position: 'absolute', 
  right: 0, 
  top: '30px', 
  background: 'white', 
  boxShadow: '0 8px 20px rgba(0,0,0,0.1)', 
  borderRadius: '12px', 
  zIndex: 10, 
  width: '180px', 
  overflow: 'hidden', 
  border: '1px solid #eff3f4' 
};

const itemMenu = { 
  width: '100%', 
  padding: '12px 16px', 
  border: 'none', 
  background: 'none', 
  textAlign: 'left', 
  cursor: 'pointer', 
  fontSize: '14px', 
  borderBottom: '1px solid #eff3f4',
  fontWeight: '500'
};

export default CardPostComunidade;