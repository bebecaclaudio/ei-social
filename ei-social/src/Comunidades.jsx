import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { useNavigate } from 'react-router-dom' // ADICIONADO PARA CONECTAR AS PÁGINAS
import {
  collection, addDoc, onSnapshot, doc, 
  query, orderBy, setDoc, increment, arrayUnion, arrayRemove, deleteDoc
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const navigate = useNavigate() // INICIALIZADO
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  // Adicionado 'descricao' no estado
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', descricao: '', categoria: '', emoji: '' })

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
      alert("Por favor, preencha o nome e verifique seu login.")
      return
    }

    // GERA O SLUG PARA A PAGINACOMUNIDADE ENCONTRAR
    const slugGerado = novaComunidade.nome.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w-]+/g, '')

    try {
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        slug: slugGerado, // SALVANDO O SLUG
        descricao: novaComunidade.descricao,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })

      await setDoc(doc(db, 'comunidades', docRef.id, 'membros', usuario.uid), {
        uid: usuario.uid,
        desde: new Date()
      })

      await setDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      }, { merge: true })

      setNovaComunidade({ nome: '', descricao: '', categoria: '', emoji: '' })
      setCriando(false)
    } catch (e) { 
      console.error("Erro ao salvar:", e)
    }
  }

  async function toggleParticipacao(id, jaParticipa) {
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', id)
    const membroRef = doc(db, 'comunidades', id, 'membros', usuario.uid)

    try {
      if (jaParticipa) {
        await deleteDoc(membroRef)
        await setDoc(userRef, { comunidadesInscritas: arrayRemove(id) }, { merge: true })
        await setDoc(comRef, { membrosCount: increment(-1) }, { merge: true })
      } else {
        await setDoc(membroRef, { uid: usuario.uid, desde: new Date() })
        await setDoc(userRef, { comunidadesInscritas: arrayUnion(id) }, { merge: true })
        await setDoc(comRef, { membrosCount: increment(1) }, { merge: true })
      }
    } catch (e) { console.error(e) }
  }

  const s = {
    input: { width: '100%', padding: '12px', borderRadius: '8px', border: '2px solid #1a1a1a', fontSize: '15px', marginBottom: '10px', color: '#000', backgroundColor: '#fff', boxSizing: 'border-box', outline: 'none' },
    label: { display: 'block', fontWeight: 'bold', fontSize: '13px', marginBottom: '5px', color: '#222' }
  }

  const filtradas = comunidades.filter(c => c.nome.toLowerCase().includes(busca.toLowerCase()))

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <input 
          placeholder="Pesquisar comunidades..." 
          style={{ ...s.input, marginBottom: 0, flex: 1, border: '1px solid #999' }}
          onChange={e => setBusca(e.target.value)}
        />
        <button onClick={() => setCriando(!criando)} style={{ background: criando ? '#666' : '#002776', color: 'white', border: 'none', borderRadius: '8px', padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' }}>
          {criando ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {criando && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '2px solid #009c3b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#002776' }}>Criar nova comunidade</h3>
          
          <label style={s.label}>Nome da Comunidade</label>
          <input style={s.input} value={novaComunidade.nome} placeholder="Ex: Desenvolvedores SP" onChange={e => setNovaComunidade({...novaComunidade, nome: e.target.value})} />

          <label style={s.label}>Descrição</label>
          <textarea style={{ ...s.input, height: '80px', fontFamily: 'inherit' }} value={novaComunidade.descricao} placeholder="Fale sobre a comunidade..." onChange={e => setNovaComunidade({...novaComunidade, descricao: e.target.value})} />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Categoria</label>
              <input style={s.input} value={novaComunidade.categoria} placeholder="Ex: Tecnologia" onChange={e => setNovaComunidade({...novaComunidade, categoria: e.target.value})} />
            </div>
            <div style={{ width: '90px' }}>
              <label style={s.label}>Emoji</label>
              <input style={s.input} value={novaComunidade.emoji} placeholder="🚀" onChange={e => setNovaComunidade({...novaComunidade, emoji: e.target.value})} />
            </div>
          </div>
          
          <button onClick={salvarComunidade} style={{ width: '100%', padding: '12px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            Salvar e Entrar
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {filtradas.map(c => {
          const participando = minhasComunidades.includes(c.id)
          return (
            <div key={c.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: participando ? '2px solid #009c3b' : '1px solid #ddd', textAlign: 'center' }}>
              
              {/* ÁREA CLICÁVEL PARA IR PARA A PÁGINA DA COMUNIDADE */}
              <div onClick={() => navigate(`/comunidades/${c.slug}`)} style={{ cursor: 'pointer' }}>
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>{c.emoji || '👥'}</div>
                <h4 style={{ margin: '5px 0', fontSize: '16px', color: '#1a1a1a' }}>{c.nome}</h4>
              </div>

              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{c.membrosCount || 0} membros</p>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation() // NÃO deixa abrir a página ao clicar no botão de sair/entrar
                  toggleParticipacao(c.id, participando)
                }}
                style={{ width: '100%', padding: '8px', borderRadius: '6px', border: 'none', background: participando ? '#f0f0f0' : '#002776', color: participando ? '#555' : 'white', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' }}
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