import React, { useState } from 'react';
import { db } from './firebase-config';
import { doc, updateDoc, deleteDoc, arrayUnion, arrayRemove, increment } from 'firebase/firestore';

const CardPostComunidade = ({ p, usuario, slugComu }) => {
  const [menuAberto, setMenuAberto] = useState(false);
  const [editando, setEditando] = useState(false);
  const [textoEditado, setTextoEditado] = useState(p.texto);

  // --- LÓGICA DE TEMPO ---
  const formatarDataHora = (ts) => {
    if (!ts) return "";
    const d = ts.toDate();
    return d.toLocaleDateString('pt-BR') + ' às ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  // --- FUNÇÕES DE INTERAÇÃO ---
  const curtir = async () => {
    const ref = doc(db, "posts_comunidades", p.id);
    const jaCurtiu = p.curtidas?.includes(usuario.uid);
    await updateDoc(ref, {
      curtidas: jaCurtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
    });
  };

  const salvar = async () => {
    const ref = doc(db, "posts_comunidades", p.id);
    const jaSalvei = p.salvosPor?.includes(usuario.uid);
    await updateDoc(ref, {
      salvosPor: jaSalvei ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
    });
    alert(jaSalvei ? "Removido dos salvos" : "Fragmento salvo!");
  };

  const excluirPost = async () => {
    if (window.confirm("Deseja apagar este fragmento para sempre?")) {
      await deleteDoc(doc(db, "posts_comunidades", p.id));
    }
  };

  const salvarEdicao = async () => {
    await updateDoc(doc(db, "posts_comunidades", p.id), { texto: textoEditado });
    setEditando(false);
  };

  const souDono = usuario?.uid === p.autorUid;

  return (
    <div style={cardEstilo}>
      {/* HEADER: AUTOR + DATA/HORA + MENU */}
      <div style={header}>
        <div style={{display: 'flex', gap: '10px'}}>
          <img src={p.autorFoto} style={avatar} alt="" />
          <div>
            <strong style={nome}>{p.autorNome}</strong>
            <span style={dataHora}>{formatarDataHora(p.data)}</span>
          </div>
        </div>

        {/* MENU TRÊS PONTINHOS (EDITAR/EXCLUIR) */}
        {souDono && (
          <div style={{position: 'relative'}}>
            <button onClick={() => setMenuAberto(!menuAberto)} style={btnMenu}>⋮</button>
            {menuAberto && (
              <div style={dropdown}>
                <button onClick={() => {setEditando(true); setMenuAberto(false)}} style={itemMenu}>Editar</button>
                <button onClick={excluirPost} style={{...itemMenu, color: 'red'}}>Excluir</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CONTEÚDO / EDIÇÃO */}
      <div style={corpo}>
        {editando ? (
          <div>
            <textarea value={textoEditado} onChange={e => setTextoEditado(e.target.value)} style={inputEdicao} />
            <button onClick={salvarEdicao} style={btnSalvar}>Salvar</button>
            <button onClick={() => setEditando(false)} style={btnCancela}>Cancelar</button>
          </div>
        ) : (
          <p style={texto}>{p.texto}</p>
        )}
      </div>

      {/* MÉTRICAS (ALCANCE) */}
      <div style={alcanceRow}>
        <span>👁️ {p.visualizacoes || 0} alcancados</span>
      </div>

      <div style={divisor} />

      {/* AÇÕES PRINCIPAIS */}
      <div style={acoes}>
        <button onClick={curtir} style={p.curtidas?.includes(usuario.uid) ? btnAtivo : btnFrio}>
          ❤️ {p.curtidas?.length || 0}
        </button>
        <button style={btnFrio}>💬 Comentar</button>
        <button style={btnFrio}>🔄 Repostar</button>
        <button onClick={salvar} style={p.salvosPor?.includes(usuario.uid) ? btnAtivo : btnFrio}>
          🔖 {p.salvosPor?.includes(usuario.uid) ? 'Salvo' : 'Salvar'}
        </button>
        <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={btnFrio}>🔗</button>
      </div>
    </div>
  );
};

// --- ESTILOS COMPLEMENTARES ---
const cardEstilo = { background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e1e8ed', marginBottom: '15px' };
const header = { display: 'flex', justifyContent: 'space-between', marginBottom: '15px' };
const avatar = { width: '40px', height: '40px', borderRadius: '12px' };
const nome = { display: 'block', fontSize: '15px', fontWeight: 'bold' };
const dataHora = { fontSize: '11px', color: '#888' };
const corpo = { marginBottom: '15px' };
const texto = { fontSize: '16px', lineHeight: '1.5', whiteSpace: 'pre-wrap' };
const alcanceRow = { fontSize: '12px', color: '#999', marginBottom: '10px' };
const divisor = { height: '1px', background: '#f0f2f5', marginBottom: '10px' };
const acoes = { display: 'flex', justifyContent: 'space-between' };
const btnFrio = { background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontWeight: 'bold', fontSize: '13px' };
const btnAtivo = { ...btnFrio, color: '#5865f2' };
const btnMenu = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' };
const dropdown = { position: 'absolute', right: 0, background: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '10px', zIndex: 10, width: '120px' };
const itemMenu = { width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' };
const inputEdicao = { width: '100%', minHeight: '100px', borderRadius: '10px', border: '1px solid #ddd', padding: '10px', marginBottom: '10px' };
const btnSalvar = { background: '#00a859', color: '#fff', border: 'none', padding: '5px 15px', borderRadius: '8px', marginRight: '5px' };
const btnCancela = { background: '#eee', border: 'none', padding: '5px 15px', borderRadius: '8px' };

export default CardPostComunidade;