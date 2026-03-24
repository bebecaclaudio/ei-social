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

  const tempoAtras = (ts) => {
    if (!ts) return "agora";
    const segundos = Math.floor((new Date() - ts.toDate()) / 1000);
    let intervalo = segundos / 31536000;
    if (intervalo > 1) return Math.floor(intervalo) + " anos atrás";
    intervalo = segundos / 2592000;
    if (intervalo > 1) return Math.floor(intervalo) + " meses atrás";
    intervalo = segundos / 86400;
    if (intervalo > 1) return Math.floor(intervalo) + " dias atrás";
    intervalo = segundos / 3600;
    if (intervalo > 1) return Math.floor(intervalo) + " horas atrás";
    intervalo = segundos / 60;
    if (intervalo > 1) return Math.floor(intervalo) + " minutos atrás";
    return Math.floor(segundos) + " segundos atrás";
  };

  // --- FUNÇÕES DE INTERAÇÃO ---
  const curtir = async () => {
    if (!usuario) return;
    const ref = doc(db, "posts_comunidades", p.id);
    const jaCurtiu = p.curtidas?.includes(usuario.uid);
    await updateDoc(ref, {
      curtidas: jaCurtiu ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
    });
  };

  const salvarRascunho = () => {
    localStorage.setItem(`rascunho_${p.id}`, p.texto);
    alert("Texto salvo como rascunho localmente!");
    setMenuAberto(false);
  };

  const salvar = async () => {
    if (!usuario) return;
    const ref = doc(db, "posts_comunidades", p.id);
    const jaSalvei = p.salvosPor?.includes(usuario.uid);
    await updateDoc(ref, {
      salvosPor: jaSalvei ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid)
    });
    setMenuAberto(false);
  };

  const excluirPost = async () => {
    if (window.confirm("Deseja apagar este fragmento?")) {
      await deleteDoc(doc(db, "posts_comunidades", p.id));
    }
    setMenuAberto(false);
  };

  const salvarEdicao = async () => {
    await updateDoc(doc(db, "posts_comunidades", p.id), { texto: textoEditado });
    setEditando(false);
  };

  const souDono = usuario?.uid === p.autorUid;

  return (
    <div style={cardEstilo}>
      {/* HEADER: AUTOR + TEMPO + MENU */}
      <div style={header}>
        <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
          <img src={p.autorFoto || `https://ui-avatars.com/api/?name=${p.autorNome}&background=random`} style={avatar} alt="" />
          <div>
            <strong style={nome}>{p.autorNome}</strong>
            <span style={dataAtras}>{tempoAtras(p.data)}</span>
          </div>
        </div>

        {/* MENU TRÊS PONTINHOS (⋮) */}
        <div style={{position: 'relative'}}>
          <button onClick={() => setMenuAberto(!menuAberto)} style={btnMenu}>⋮</button>
          {menuAberto && (
            <div style={dropdown}>
              {souDono ? (
                <>
                  <button onClick={() => {setEditando(true); setMenuAberto(false)}} style={itemMenu}>📝 Editar</button>
                  <button onClick={excluirPost} style={{...itemMenu, color: 'red'}}>🗑️ Excluir</button>
                  <button onClick={salvarRascunho} style={itemMenu}>💾 Salvar Rascunho</button>
                </>
              ) : (
                <>
                  <button onClick={salvar} style={itemMenu}>{p.salvosPor?.includes(usuario?.uid) ? '🔖 Salvo' : '🔖 Salvar'}</button>
                  <button style={itemMenu}>🚩 Denunciar</button>
                  <button style={itemMenu}>🔗 Incorporar</button>
                  <button onClick={() => setMenuAberto(false)} style={itemMenu}>❌ Cancelar</button>
                </>
              )}
            </div>
          )}
        </div>
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

      {/* DATA E HORA DA POSTAGEM (ACIMA DOS ÍCONES) */}
      <div style={dataHoraRow}>
        <span>{formatarDataHora(p.data)}</span>
      </div>

      <div style={divisor} />

      {/* AÇÕES PRINCIPAIS (ÍCONES SOLICITADOS) */}
      <div style={acoes}>
        <button onClick={curtir} style={p.curtidas?.includes(usuario?.uid) ? btnAtivo : btnFrio} title="Curtir">
          ❤️ {p.curtidas?.length || 0}
        </button>
        <button style={btnFrio} title="Comentar">💬</button>
        <button style={btnFrio} title="Repostar">🔄</button>
        <button onClick={() => navigator.clipboard.writeText(window.location.href)} style={btnFrio} title="Compartilhar">
          🔗
        </button>
        {/* VISUALIZAÇÕES LÁ NA PONTA */}
        <div style={alcance} title="Visualizações">
          👁️ {p.visualizacoes || 0}
        </div>
      </div>
    </div>
  );
};

// --- ESTILOS COMPLEMENTARES ---
const cardEstilo = { background: '#fff', padding: '20px', borderRadius: '24px', border: '1px solid #e1e8ed', marginBottom: '15px' };
const header = { display: 'flex', justifyContent: 'space-between', marginBottom: '15px', alignItems: 'center' };
const avatar = { width: '42px', height: '42px', borderRadius: '50%', objectFit: 'cover' };
const nome = { fontSize: '15px', fontWeight: 'bold', color: '#1a1a1a' };
const dataAtras = { fontSize: '12px', color: '#888', marginLeft: '8px' };
const corpo = { marginBottom: '15px' };
const texto = { fontSize: '16px', lineHeight: '1.5', whiteSpace: 'pre-wrap', color: '#1c1e21' };
const dataHoraRow = { fontSize: '12px', color: '#888', marginBottom: '10px' };
const divisor = { height: '1px', background: '#f0f2f5', marginBottom: '10px' };
const acoes = { display: 'flex', gap: '20px', alignItems: 'center', position: 'relative' };
const btnFrio = { background: 'none', border: 'none', cursor: 'pointer', color: '#666', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '5px' };
const btnAtivo = { ...btnFrio, color: '#5865f2' };
const alcance = { fontSize: '12px', color: '#999', position: 'absolute', right: 0 };
const btnMenu = { background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' };
const dropdown = { position: 'absolute', right: 0, top: '100%', background: 'white', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', borderRadius: '12px', zIndex: 10, width: '160px', overflow: 'hidden' };
const itemMenu = { width: '100%', padding: '12px 15px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', color: '#1a1a1a', display: 'block' };
const inputEdicao = { width: '100%', minHeight: '100px', borderRadius: '12px', border: '1px solid #ddd', padding: '10px', marginBottom: '10px', fontSize: '16px', resize: 'none' };
const btnSalvar = { background: '#00a859', color: '#fff', border: 'none', padding: '8px 20px', borderRadius: '10px', marginRight: '8px', cursor: 'pointer', fontWeight: 'bold' };
const btnCancela = { background: '#eee', border: 'none', padding: '8px 20px', borderRadius: '10px', cursor: 'pointer', color: '#333' };

export default CardPostComunidade;