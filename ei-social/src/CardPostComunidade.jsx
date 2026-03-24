import React, { useState, useRef, useEffect } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, deleteDoc } from 'firebase/firestore';
import { db } from './firebase-config';
import { Link } from 'react-router-dom';

const formatarDataTwitter = (dataFirestore) => {
  if (!dataFirestore) return 'Agora';
  const data = dataFirestore.toDate();
  return data.toLocaleTimeString('pt-BR', { hour: 'numeric', minute: '2-digit' }) + ' · ' + 
         data.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' });
};

const CardPostComunidade = ({ p, usuario, slugComu }) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const fecharMenu = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuAberto(false);
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
    if (window.confirm("Apagar fragmento?")) {
      await deleteDoc(doc(db, "posts_comunidades", p.id));
    }
  };

  return (
    <div style={cardEstilo}>
      <div style={breadcrumbPost}>
        <Link to="/comunidades" style={linkBread}>Comunidades</Link>
        <span style={divisorBread}>/</span>
        <Link to={`/comunidades/${slugComu}`} style={linkBreadAtivo}>{slugComu}</Link>
      </div>

      <div style={headerPost}>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          <img 
            src={p.autorFoto || `https://ui-avatars.com/api/?name=${p.autorNome}&background=random`} 
            style={avatarMini} 
            alt="" 
          />
          <div>
            <strong style={nomeAutor}>{p.autorNome}</strong>
            <small style={dataPostEstilo}>{formatarDataTwitter(p.data)}</small>
          </div>
        </div>

        <div style={{ position: 'relative' }} ref={menuRef}>
          <button onClick={() => setMenuAberto(!menuAberto)} style={btnDots}>•••</button>
          {menuAberto && (
            <div style={dropdownMenu}>
              {p.autorUid === usuario?.uid && (
                <button onClick={apagarPost} style={{ ...itemMenu, color: '#ff4b4b', borderBottom: 'none' }}>🗑️ Apagar</button>
              )}
              <button style={itemMenu}>🔖 Salvar</button>
            </div>
          )}
        </div>
      </div>

      <Link to={`/post/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <p style={corpoTexto}>{p.texto}</p>
      </Link>

      <div style={barraAcoes}>
        <button onClick={toggleLike} style={btnInteracao(p.curtidas?.includes(usuario?.uid), '#f91880')}>
          {p.curtidas?.includes(usuario?.uid) ? '❤️' : '🤍'} {p.curtidas?.length || 0}
        </button>
        <button style={btnInteracao(false, '#1d9bf0')}>💬 {p.comentariosCount || 0}</button>
        <button style={btnInteracao(false, '#536471')}>📊 {p.visualizacoes || 0}</button>
        <button onClick={() => {
           navigator.clipboard.writeText(`${window.location.origin}/post/${p.id}`);
           alert("Link copiado!");
        }} style={btnInteracao(false, '#1d9bf0')}>🔗</button>
      </div>
    </div>
  );
};

// --- ESTILOS ---
const cardEstilo = { background: 'white', padding: '18px 20px', borderRadius: '18px', marginBottom: '15px', border: '1px solid #f0f0f0' };
const breadcrumbPost = { fontSize: '11px', marginBottom: '12px', display: 'flex', alignItems: 'center', color: '#aaa', fontWeight: 'bold' };
const linkBread = { textDecoration: 'none', color: '#aaa' };
const divisorBread = { margin: '0 6px' };
const linkBreadAtivo = { textDecoration: 'none', color: '#00a859' };
const headerPost = { display: 'flex', justifyContent: 'space-between', alignItems: 'center' };
const avatarMini = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' };
const nomeAutor = { display: 'block', fontSize: '15px', fontWeight: 'bold' };
const dataPostEstilo = { color: '#536471', fontSize: '13px' };
const corpoTexto = { margin: '12px 0', fontSize: '15px', lineHeight: '1.5', whiteSpace: 'pre-wrap' };
const barraAcoes = { display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eff3f4', paddingTop: '12px' };
const btnInteracao = (ativo, cor) => ({ background: 'none', border: 'none', cursor: 'pointer', color: ativo ? cor : '#536471', fontSize: '13px' });
const btnDots = { background: 'none', border: 'none', cursor: 'pointer', color: '#cfd9de', fontSize: '18px' };
const dropdownMenu = { position: 'absolute', right: 0, top: '30px', background: 'white', boxShadow: '0 8px 20px rgba(0,0,0,0.1)', borderRadius: '12px', zIndex: 10, width: '150px', border: '1px solid #eff3f4' };
const itemMenu = { width: '100%', padding: '12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #eff3f4' };

export default CardPostComunidade;