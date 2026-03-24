import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import {
  collection, addDoc, onSnapshot, doc, updateDoc,
  arrayUnion, arrayRemove, query, orderBy, setDoc
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', categoria: '', emoji: '' })

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

  async function criarComunidade() {
    if (!novaComunidade.nome.trim() || !usuario?.uid) return
    try {
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '⭐',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      })
      setNovaComunidade({ nome: '', categoria: '', emoji: '' })
      setCriando(false)
    } catch (e) { console.error(e) }
  }

  async function toggleParticipacao(id) {
    if (!usuario?.uid) return
    const jaParticipa = minhasComunidades.includes(id)
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', id)
    try {
      await updateDoc(userRef, {
        comunidadesInscritas: jaParticipa ? arrayRemove(id) : arrayUnion(id)
      })
      await updateDoc(comRef, {
        membrosCount: jaParticipa ? Math.max(0, (comunidades.find(c => c.id === id)?.membrosCount || 1) - 1) : (comunidades.find(c => c.id === id)?.membrosCount || 0) + 1
      })
    } catch (e) { console.error(e) }
  }

  const filtradas = comunidades.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  const minhas = filtradas.filter(c => minhasComunidades.includes(c.id))
  const descobrir = filtradas.filter(c => !minhasComunidades.includes(c.id))

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>

        {/* BUSCA E CRIAR */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            placeholder="Buscar comunidade..."
            value={busca}
            onChange={e => setBusca(e.target.value)}
            style={{
              flex: 1, padding: '12px 18px', borderRadius: '12px',
              border: '2px solid #ddd', fontSize: '15px', outline: 'none', color: '#333'
            }}
          />
          <button onClick={() => setCriando(!criando)} style={{
            padding: '12px 20px', borderRadius: '12px', border: 'none',
            background: criando ? '#ff4444' : 'linear-gradient(90deg, #002776, #009c3b)',
            color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer'
          }}>
            {criando ? 'Cancelar' : '+ Criar'}
          </button>
        </div>

        {/* FORMULÁRIO CRIAR */}
        {criando && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '2px solid #009c3b'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#002776' }}>Nova Comunidade</h3>
            <input
              placeholder="Nome da comunidade *"
              value={novaComunidade.nome}
              onChange={e => setNovaComunidade({ ...novaComunidade, nome: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                marginBottom: '12px', color: '#333', boxSizing: 'border-box'
              }}
            />
            <input
              placeholder="Categoria (ex: Musica, Esportes...)"
              value={novaComunidade.categoria}
              onChange={e => setNovaComunidade({ ...novaComunidade, categoria: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                marginBottom: '12px', color: '#333', boxSizing: 'border-box'
              }}
            />
            <input
              placeholder="Emoji (ex: 🎸)"
              value={novaComunidade.emoji}
              onChange={e => setNovaComunidade({ ...novaComunidade, emoji: e.target.value })}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                marginBottom: '16px', color: '#333', boxSizing: 'border-box'
              }}
            />
            <button onClick={criarComunidade} style={{
              width: '100%', padding: '12px', borderRadius: '10px', border: 'none',
              background: '#ffdf00', color: '#002776', fontWeight: '800',
              fontSize: '15px', cursor: 'pointer'
            }}>Criar!</button>
          </div>
        )}

        {/* MINHAS COMUNIDADES */}
        {minhas.length > 0 && (
          <>
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#002776', marginBottom: '12px' }}>
              Minhas Comunidades
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
              {minhas.map(c => (
                <div key={c.id} style={{
                  background: 'white', borderRadius: '16px', padding: '16px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #009c3b'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>{c.emoji || '👥'}</div>
                  <p style={{ fontWeight: '800', fontSize: '15px', color: '#222' }}>{c.nome}</p>
                  <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 12px' }}>
                    {(c.membrosCount || 0).toLocaleString()} membros • {c.categoria}
                  </p>
                  <button onClick={() => toggleParticipacao(c.id)} style={{
                    width: '100%', padding: '8px', borderRadius: '8px',
                    border: '2px solid #e00', background: 'white',
                    color: '#e00', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                  }}>Sair</button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* DESCOBRIR */}
        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#002776', marginBottom: '12px' }}>
          Descobrir Comunidades
        </h2>
        {descobrir.length === 0 ? (
          <p style={{ color: '#888', textAlign: 'center', padding: '40px' }}>
            Nenhuma comunidade encontrada. Crie a primeira! 🚀
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {descobrir.map(c => (
              <div key={c.id} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{c.emoji || '👥'}</div>
                <p style={{ fontWeight: '800', fontSize: '15px', color: '#222' }}>{c.nome}</p>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 12px' }}>
                  {(c.membrosCount || 0).toLocaleString()} membros • {c.categoria}
                </p>
                <button onClick={() => toggleParticipacao(c.id)} style={{
                  width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(90deg, #002776, #009c3b)',
                  color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}>Participar</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Comunidades