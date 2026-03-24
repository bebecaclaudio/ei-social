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

  // 1. Monitorar Coleção de Comunidades (Tempo Real)
  useEffect(() => {
    const q = query(collection(db, 'comunidades'), orderBy('dataCriacao', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setComunidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // 2. Monitorar o Perfil do Usuário (Para manter as inscrições salvas)
  useEffect(() => {
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const unsub = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setMinhasComunidades(docSnap.data().comunidadesInscritas || [])
      } else {
        // Se o documento do usuário não existir, cria um vazio para evitar erros
        setDoc(userRef, { comunidadesInscritas: [] }, { merge: true })
      }
    })
    return () => unsub()
  }, [usuario])

  // 3. Salvar Nova Comunidade
  async function salvarComunidade() {
    if (!novaComunidade.nome.trim() || !usuario?.uid) {
      alert("Por favor, preencha o nome e verifique seu login.")
      return
    }

    try {
      // Cria a comunidade
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })

      // Adiciona a comunidade criada automaticamente à lista do usuário
      await setDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      }, { merge: true })

      // Limpa o formulário e fecha
      setNovaComunidade({ nome: '', categoria: '', emoji: '' })
      setCriando(false)
    } catch (e) { 
      console.error("Erro ao salvar no banco:", e)
      alert("Erro ao salvar. Verifique se as Regras do Firebase estão como 'true'.")
    }
  }

  // 4. Entrar ou Sair (Lógica Atômica)
  async function toggleParticipacao(id, jaParticipa) {
    if (!usuario?.uid) return
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', id)

    try {
      // Atualiza lista do usuário
      await setDoc(userRef, {
        comunidadesInscritas: jaParticipa ? arrayRemove(id) : arrayUnion(id)
      }, { merge: true })

      // Atualiza contador da comunidade no servidor (incremento seguro)
      await setDoc(comRef, {
        membrosCount: increment(jaParticipa ? -1 : 1)
      }, { merge: true })
    } catch (e) { 
      console.error("Erro ao mudar participação:", e) 
    }
  }

  // Estilos de Alto Contraste
  const s = {
    input: {
      width: '100%',
      padding: '12px',
      borderRadius: '8px',
      border: '2px solid #1a1a1a', // Borda bem escura para contraste
      fontSize: '15px',
      marginBottom: '10px',
      color: '#000',
      backgroundColor: '#fff',
      boxSizing: 'border-box',
      outline: 'none'
    },
    label: {
      display: 'block',
      fontWeight: 'bold',
      fontSize: '13px',
      marginBottom: '5px',
      color: '#222'
    }
  }

  const filtradas = comunidades.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  return (
    <div style={{ maxWidth: '650px', margin: '0 auto', padding: '20px', fontFamily: '"Segoe UI", Tahoma, sans-serif' }}>
      
      {/* Cabeçalho de Busca */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '25px' }}>
        <input 
          placeholder="Pesquisar comunidades..." 
          style={{ ...s.input, marginBottom: 0, flex: 1, border: '1px solid #999' }}
          onChange={e => setBusca(e.target.value)}
        />
        <button 
          onClick={() => setCriando(!criando)}
          style={{ 
            background: criando ? '#666' : '#002776', 
            color: 'white', border: 'none', borderRadius: '8px', 
            padding: '0 20px', cursor: 'pointer', fontWeight: 'bold' 
          }}
        >
          {criando ? 'Fechar' : '+ Nova'}
        </button>
      </div>

      {/* Formulário de Criação (Compacto) */}
      {criando && (
        <div style={{ 
          background: '#f9f9f9', padding: '20px', borderRadius: '12px', 
          marginBottom: '30px', border: '2px solid #009c3b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' 
        }}>
          <h3 style={{ marginTop: 0, color: '#002776' }}>Criar nova comunidade</h3>
          
          <label style={s.label}>Nome da Comunidade</label>
          <input 
            style={s.input} 
            value={novaComunidade.nome}
            placeholder="Ex: Desenvolvedores SP"
            onChange={e => setNovaComunidade({...novaComunidade, nome: e.target.value})}
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Categoria</label>
              <input 
                style={s.input} 
                placeholder="Ex: Tecnologia"
                onChange={e => setNovaComunidade({...novaComunidade, categoria: e.target.value})}
              />
            </div>
            <div style={{ width: '90px' }}>
              <label style={s.label}>Emoji</label>
              <input 
                style={s.input} 
                placeholder="🚀"
                onChange={e => setNovaComunidade({...novaComunidade, emoji: e.target.value})}
              />
            </div>
          </div>
          
          <button 
            onClick={salvarComunidade}
            style={{ 
              width: '100%', padding: '12px', background: '#009c3b', 
              color: 'white', border: 'none', borderRadius: '8px', 
              fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' 
            }}
          >
            Salvar e Entrar
          </button>
        </div>
      )}

      {/* Grid de Comunidades */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {filtradas.map(c => {
          const participando = minhasComunidades.includes(c.id)
          return (
            <div key={c.id} style={{ 
              background: 'white', padding: '20px', borderRadius: '15px', 
              border: participando ? '2px solid #009c3b' : '1px solid #ddd', 
              textAlign: 'center', transition: '0.3s',
              boxShadow: participando ? '0 4px 10px rgba(0,156,59,0.1)' : 'none'
            }}>
              <div style={{ fontSize: '40px', marginBottom: '10px' }}>{c.emoji || '👥'}</div>
              <h4 style={{ margin: '5px 0', fontSize: '16px', color: '#1a1a1a' }}>{c.nome}</h4>
              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{c.membrosCount || 0} membros</p>
              
              <button 
                onClick={() => toggleParticipacao(c.id, participando)}
                style={{ 
                  width: '100%', padding: '8px', borderRadius: '6px', border: 'none',
                  background: participando ? '#f0f0f0' : '#002776',
                  color: participando ? '#555' : 'white',
                  cursor: 'pointer', fontWeight: 'bold', fontSize: '13px'
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