import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from './firebase-config'
import { doc, onSnapshot, updateDoc, collection, query, where } from 'firebase/firestore'

function GerenciarComunidade({ usuario }) {
  const { id } = useParams() // Captura o slug ou ID da URL
  const navigate = useNavigate()
  const [comu, setComu] = useState(null)
  const [editando, setEditando] = useState({ nome: '', descricao: '', emoji: '', corCapa: '' })
  const [salvando, setSalvando] = useState(false)

  useEffect(() => {
    // Busca a comunidade (usando a mesma lógica de slug para garantir compatibilidade)
    const q = query(collection(db, "comunidades"), where("slug", "==", id));
    
    const unsub = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const docSnap = snapshot.docs[0];
        const dados = docSnap.data();
        
        // Segurança: Só permite o dono gerenciar
        if (dados.criadoPor !== usuario?.uid) {
          navigate(`/comunidades/${id}`);
          return;
        }

        setComu({ id: docSnap.id, ...dados });
        setEditando({
          nome: dados.nome || '',
          descricao: dados.descricao || '',
          emoji: dados.emoji || '👥',
          corCapa: dados.corCapa || '#002776'
        });
      }
    });
    return () => unsub();
  }, [id, usuario, navigate]);

  async function salvarAlteracoes() {
    if (!comu?.id) return;
    setSalvando(true);
    try {
      const comRef = doc(db, 'comunidades', comu.id);
      await updateDoc(comRef, editando);
      alert("Comunidade atualizada com sucesso!");
      navigate(`/comunidades/${id}`);
    } catch (e) {
      console.error("Erro ao atualizar:", e);
      alert("Erro ao salvar alterações.");
    } finally {
      setSalvando(false);
    }
  }

  if (!comu) return <div style={{ padding: '50px', textAlign: 'center' }}>Carregando configurações...</div>

  const s = {
    container: { maxWidth: '600px', margin: '40px auto', padding: '20px', background: 'white', borderRadius: '15px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' },
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #ddd', marginBottom: '15px', boxSizing: 'border-box' },
    label: { display: 'block', fontWeight: 'bold', marginBottom: '5px', fontSize: '14px' },
    btnSalvar: { width: '100%', padding: '15px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }
  }

  return (
    <div style={s.container}>
      <h2 style={{ marginBottom: '20px' }}>⚙️ Gerenciar: {comu.nome}</h2>

      <label style={s.label}>Emoji da Comunidade</label>
      <input style={s.input} value={editando.emoji} onChange={e => setEditando({...editando, emoji: e.target.value})} placeholder="Ex: 👑" />

      <label style={s.label}>Cor da Capa (Hexadecimal)</label>
      <input type="color" style={{ ...s.input, height: '45px', padding: '5px' }} value={editando.corCapa} onChange={e => setEditando({...editando, corCapa: e.target.value})} />

      <label style={s.label}>Descrição</label>
      <textarea 
        style={{ ...s.input, minHeight: '100px', resize: 'vertical' }} 
        value={editando.descricao} 
        onChange={e => setEditando({...editando, descricao: e.target.value})}
        placeholder="Escreva sobre o que é esta comunidade..."
      />

      <button 
        onClick={salvarAlteracoes} 
        disabled={salvando}
        style={{ ...s.btnSalvar, opacity: salvando ? 0.7 : 1 }}
      >
        {salvando ? 'Salvando...' : 'Salvar Alterações'}
      </button>

      <button 
        onClick={() => navigate(`/comunidades/${id}`)}
        style={{ background: 'none', border: 'none', color: '#666', width: '100%', marginTop: '15px', cursor: 'pointer' }}
      >
        Cancelar e Voltar
      </button>
    </div>
  )
}

export default GerenciarComunidade;