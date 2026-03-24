import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import {
  collection, addDoc, onSnapshot, doc, 
  query, orderBy, setDoc, increment, arrayUnion, arrayRemove
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', categoria: '', emoji: '' })

  // 1. Monitorar Comunidades
  useEffect(() => {
    const q = query(collection(db, 'comunidades'), orderBy('dataCriacao', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setComunidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // 2. Monitorar Participação do Usuário
  useEffect(() => {
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setMinhasComunidades(docSnap.data().comunidadesInscritas || [])
      }
    })
    return () => unsub()
  }, [usuario])

  // 3. Salvar Nova Comunidade
  async function salvarComunidade() {
    if (!novaComunidade.nome.trim() || !usuario?.uid) return
    try {
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })

      // Vincula ao usuário usando setDoc (mais seguro que updateDoc)
      await setDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      }, { merge: true })

      setNovaComunidade({ nome: '', categoria: '', emoji: '' })
      setCriando(false)
    } catch (e) { console.error("Erro ao salvar:", e) }
  }

  // 4. Entrar ou Sair
  async function toggleParticipacao(id, jaParticipa) {
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', id)

    try {
      await setDoc(userRef, {
        comunidadesInscritas: jaParticipa ? arrayRemove(id) : arrayUnion(id)
      }, { merge: true })

      await setDoc(comRef, {
        membrosCount: increment(jaParticipa ? -1 : 1)
      }, { merge: true })
    } catch (e) { console.error("Erro ao mudar participação:", e) }
  }

  const inputStyle = {
    width: '100%',
    padding: '10px',
    borderRadius: '6px',
    border: '2px solid #333', // Alto contraste
    fontSize: '14px',
    marginBottom: '10px',
    color: '#000',
    backgroundColor: '#fff',
    boxSizing: 'border-box'
  }

  const filtradas = comunidades.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* Busca e Botão Novo */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          placeholder="Buscar..." 
          style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
          onChange={e => setBusca(e.target.value)}
        />
        <button 
          onClick={() => setCriando(!criando)}
          style={{ background: '#002776', color: 'white', border: 'none', borderRadius: '6px', padding: '0 15px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {criando ? 'Fechar' : 'Nova'}
        </button>
      </div>

      {/* Formulário Compacto */}
      {criando && (
        <div style={{ background: '#eee', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #999' }}>
          <label style={{ fontWeight: 'bold', fontSize: '12px' }}>Nome da Comunidade:</label>
          <input 
            style={inputStyle} 
            value={novaComunidade.nome}
            onChange={e => setNovaComunidade({...novaComunidade, nome: e.target.value})}
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontWeight: 'bold', fontSize: '12px' }}>Categoria:</label>
              <input 
                style={inputStyle} 
                onChange={e => setNovaComunidade({...novaComunidade, categoria: e.target.value})}
              />
            </div>
            <div style={{ width: '70px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '12px' }}>Emoji:</label>
              <input 
                style={inputStyle} 
                placeholder="🚀"
                onChange={e => setNovaComunidade({...novaComunidade, emoji: e.target.value})}
              />
            </div>
          </div>
          <button 
            onClick={salvarComunidade}
            style={{ width: '100%', padding: '10px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            Salvar Comunidade
          </button>
        </div>
      )}

      {/* Lista de Comunidades */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        {filtradas.map(c => {
          const participando = minhasComunidades.includes(c.id)
          return (
            <div key={c.id} style={{ background: 'white', padding: '15px', borderRadius: '10px', border: participando ? '2px solid #009c3b' : '1px solid #ccc', textAlign: 'center' }}>
              <div style={{ fontSize: '30px' }}>{c.emoji || '👥'}</div>
              <h4 style={{ margin: '5px 0', fontSize: '14px' }}>{c.nome}</h4>
              <p style={{ fontSize: '11px', color: '#666' }}>{c.membrosCount || 0} membros</p>
              <button 
                onClick={() => toggleParticipacao(c.id, participando)}
                style={{ 
                  width: '100%', marginTop: '10px', padding: '6px', borderRadius: '4px', border: 'none',
                  background: participando ? '#ffeded' : '#002776',
                  color: participando ? '#cc0000' : 'white',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '12px'
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