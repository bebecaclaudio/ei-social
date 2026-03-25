import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from './firebase-config'
import {
  collection, addDoc, onSnapshot, doc, 
  query, orderBy, setDoc, updateDoc, increment, arrayUnion, arrayRemove
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const navigate = useNavigate()
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', categoria: '', emoji: '' })

  const gerarSlug = (texto) => {
    return texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^\w ]+/g, '')        
      .replace(/ +/g, '-')           
      .trim();
  };

  useEffect(() => {
    const q = query(collection(db, 'comunidades'), orderBy('dataCriacao', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setComunidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setMinhasComunidades(docSnap.data().comunidadesInscritas || [])
      } else {
        setDoc(userRef, { comunidadesInscritas: [] }, { merge: true })
      }
    })
    return () => unsub()
  }, [usuario])

  async function salvarComunidade() {
    if (!novaComunidade.nome.trim() || !usuario?.uid) {
      alert("Por favor, preencha o nome.")
      return
    }

    const slugBonito = gerarSlug(novaComunidade.nome);

    try {
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        slug: slugBonito,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        membros: [usuario.uid], // <--- ADICIONA VOCÊ COMO PRIMEIRO MEMBRO NA LISTA
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })

      await setDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      }, { merge: true })

      setNovaComunidade({ nome: '', categoria: '', emoji: '' })
      setCriando(false)
      
      navigate(`/comunidades/${slugBonito}`)
    } catch (e) { 
      console.error("Erro ao salvar:", e)
    }
  }

  async function toggleParticipacao(e, id, jaParticipa) {
    e.stopPropagation() 
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', id)

    try {
      // 1. Atualiza a lista de inscritos do Usuário
      await updateDoc(userRef, {
        comunidadesInscritas: jaParticipa ? arrayRemove(id) : arrayUnion(id)
      })

      // 2. Atualiza a lista de membros e o contador da Comunidade
      await updateDoc(comRef, {
        membros: jaParticipa ? arrayRemove(usuario.uid) : arrayUnion(usuario.uid),
        membrosCount: increment(jaParticipa ? -1 : 1)
      })
    } catch (e) { 
      console.error("Erro:", e) 
    }
  }

  const s = {
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #1a1a1a', fontSize: '15px', marginBottom: '10px', backgroundColor: '#fff', boxSizing: 'border-box' },
    label: { display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', color: '#222' }
  }

  const filtradas = comunidades.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px' }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <input 
          placeholder="Pesquisar comunidades..." 
          style={{ ...s.input, marginBottom: 0, flex: 1, border: '1px solid #999' }}
          onChange={e => setBusca(e.target.value)}
        />
        <button 
          onClick={() => setCriando(!criando)}
          style={{ background: criando ? '#666' : '#002776', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {criando ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {criando && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '2px solid #009c3b' }}>
          <h3 style={{ marginTop: 0 }}>Criar nova comunidade</h3>
          <label style={s.label}>Nome</label>
          <input style={s.input} value={novaComunidade.nome} onChange={e => setNovaComunidade({...novaComunidade, nome: e.target.value})} />
          <button onClick={salvarComunidade} style={{ width: '100%', padding: '12px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Salvar e Entrar
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {filtradas.map(c => {
          // CHECAGEM DUPLA: Verifica na lista de inscritos do usuário ou se o UID dele está no array de membros da comunidade
          const participando = minhasComunidades.includes(c.id) || c.membros?.includes(usuario?.uid);
          const urlDestino = c.slug || c.id;

          return (
            <div 
              key={c.id} 
              onClick={() => navigate(`/comunidades/${urlDestino}`)} 
              style={{ 
                background: 'white', padding: '20px', borderRadius: '15px', 
                border: participando ? '2px solid #009c3b' : '1px solid #ddd', 
                textAlign: 'center', cursor: 'pointer', transition: '0.2s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-3px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{c.emoji || '👥'}</div>
              <h4 style={{ margin: '5px 0', fontSize: '16px' }}>{c.nome}</h4>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{c.membrosCount || 0} membros</p>
              
              <button 
                onClick={(e) => toggleParticipacao(e, c.id, participando)} 
                style={{ 
                  width: '100%', padding: '8px', borderRadius: '6px', border: 'none',
                  background: participando ? '#f0f0f0' : '#002776',
                  color: participando ? '#555' : 'white',
                  cursor: 'pointer', fontWeight: 'bold'
                }}
              >
                {participando ? 'Sair' : 'Participar'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default Comunidades;