import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import {
  collection, addDoc, onSnapshot, doc, 
  query, orderBy, setDoc, increment, arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  // 1. Estado inicial com todos os campos que você quer
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', descricao: '', categoria: '', emoji: '' })

  // Monitorar todas as comunidades
  useEffect(() => {
    const q = query(collection(db, 'comunidades'), orderBy('dataCriacao', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setComunidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // Monitorar o que o usuário participa (essencial para o botão funcionar)
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
      alert("Preencha o nome da comunidade!")
      return
    }

    try {
      // Salva a comunidade com a descrição
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        descricao: novaComunidade.descricao,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })

      // Cria a subcoleção de membros (Escalabilidade)
      await setDoc(doc(db, 'comunidades', docRef.id, 'membros', usuario.uid), {
        uid: usuario.uid,
        desde: new Date()
      })

      // Atualiza o perfil do usuário
      await setDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      }, { merge: true })

      setNovaComunidade({ nome: '', descricao: '', categoria: '', emoji: '' })
      setCriando(false)
    } catch (e) { console.error(e) }
  }

  async function toggleParticipacao(id, jaParticipa) {
    if (!usuario?.uid) return
    
    // Referências importantes
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', id)
    const membroRef = doc(db, 'comunidades', id, 'membros', usuario.uid)

    try {
      if (jaParticipa) {
        // Lógica de SAIR
        await deleteDoc(membroRef)
        await setDoc(userRef, { comunidadesInscritas: arrayRemove(id) }, { merge: true })
        await setDoc(comRef, { membrosCount: increment(-1) }, { merge: true })
      } else {
        // Lógica de ENTRAR
        await setDoc(membroRef, { uid: usuario.uid, desde: new Date() })
        await setDoc(userRef, { comunidadesInscritas: arrayUnion(id) }, { merge: true })
        await setDoc(comRef, { membrosCount: increment(1) }, { merge: true })
      }
    } catch (e) { console.error("Erro no clique:", e) }
  }

  const s = {
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #1a1a1a', marginBottom: '10px', boxSizing: 'border-box' },
    label: { display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px' }
  }

  const filtradas = comunidades.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Barra de Busca */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <input 
          placeholder="Pesquisar..." 
          style={{ ...s.input, marginBottom: 0, flex: 1 }}
          onChange={e => setBusca(e.target.value)}
        />
        <button onClick={() => setCriando(!criando)} style={{ padding: '0 20px', borderRadius: '8px', cursor: 'pointer', background: '#002776', color: 'white', border: 'none' }}>
          {criando ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {/* Formulário de Criação */}
      {criando && (
        <div style={{ background: '#f4f4f4', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ddd' }}>
          <label style={s.label}>Nome</label>
          <input style={s.input} value={novaComunidade.nome} onChange={e => setNovaComunidade({...novaComunidade, nome: e.target.value})} />
          
          <label style={s.label}>Descrição</label>
          <textarea 
            style={{ ...s.input, height: '60px', fontFamily: 'inherit' }} 
            value={novaComunidade.descricao} 
            onChange={e => setNovaComunidade({...novaComunidade, descricao: e.target.value})} 
          />

          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Categoria</label>
              <input style={s.input} value={novaComunidade.categoria} onChange={e => setNovaComunidade({...novaComunidade, categoria: e.target.value})} />
            </div>
            <div style={{ width: '80px' }}>
              <label style={s.label}>Emoji</label>
              <input style={s.input} value={novaComunidade.emoji} onChange={e => setNovaComunidade({...novaComunidade, emoji: e.target.value})} />
            </div>
          </div>
          <button onClick={salvarComunidade} style={{ width: '100%', padding: '12px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>
            Salvar Comunidade
          </button>
        </div>
      )}

      {/* Listagem */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {filtradas.map(c => {
          const participando = minhasComunidades.includes(c.id)
          return (
            <div key={c.id} style={{ padding: '20px', borderRadius: '15px', border: '1px solid #ddd', textAlign: 'center', background: 'white' }}>
              <div style={{ fontSize: '40px' }}>{c.emoji || '👥'}</div>
              <h4 style={{ margin: '10px 0' }}>{c.nome}</h4>
              <p style={{ fontSize: '12px', color: '#666' }}>{c.membrosCount || 0} membros</p>
              
              <button 
                onClick={() => toggleParticipacao(c.id, participando)}
                style={{ 
                  width: '100%', padding: '10px', marginTop: '10px', borderRadius: '8px', cursor: 'pointer',
                  background: participando ? '#eee' : '#002776',
                  color: participando ? '#333' : 'white',
                  border: 'none', fontWeight: 'bold'
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

export default Comunidades