import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  query,
  orderBy,
  setDoc,
  getDoc
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', categoria: '', emoji: '' })

  // 1. CARREGAR COMUNIDADES DO BANCO (REALTIME)
  useEffect(() => {
    const q = query(collection(db, 'comunidades'), orderBy('dataCriacao', 'desc'))
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dados = snapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      }))
      setComunidades(dados)
    })
    return () => unsubscribe()
  }, [])

  // 2. CARREGAR MINHAS INSCRIÇÕES (EVITA SAIR AO ATUALIZAR)
  useEffect(() => {
    if (!usuario?.uid) return

    const userRef = doc(db, 'usuarios', usuario.uid)
    
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setMinhasComunidades(docSnap.data().comunidadesInscritas || [])
      } else {
        // Se o doc do usuário não existir, cria um vazio para evitar erros
        setDoc(userRef, { comunidadesInscritas: [] }, { merge: true })
      }
    })

    return () => unsubscribe()
  }, [usuario])

  // 3. CRIAR COMUNIDADE REAL NO FIREBASE
  const criarComunidade = async () => {
    if (!novaComunidade.nome.trim() || !usuario?.uid) {
      alert("Erro: Verifique se você está logado e se deu um nome à comunidade.")
      return
    }

    try {
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: novaComunidade.nome,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: new Date()
      })

      // Adiciona automaticamente ao perfil do usuário
      await updateDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      })

      setNovaComunidade({ nome: '', categoria: '', emoji: '' })
      setCriando(false)
      alert("Comunidade criada com sucesso!")
    } catch (e) {
      console.error(e)
      alert("Erro ao salvar no banco de dados.")
    }
  }

  // 4. PARTICIPAR / SAIR (ATUALIZA O BANCO E O CONTADOR)
  const toggleParticipacao = async (comunidadeId) => {
    if (!usuario?.uid) return alert("Logue para participar")

    const jaParticipa = minhasComunidades.includes(comunidadeId)
    const userRef = doc(db, 'usuarios', usuario.uid)
    const comRef = doc(db, 'comunidades', comunidadeId)

    try {
      if (jaParticipa) {
        await updateDoc(userRef, { comunidadesInscritas: arrayRemove(comunidadeId) })
        const comSnap = await getDoc(comRef)
        const novoTotal = Math.max(0, (comSnap.data().membrosCount || 1) - 1)
        await updateDoc(comRef, { membrosCount: novoTotal })
      } else {
        await updateDoc(userRef, { comunidadesInscritas: arrayUnion(comunidadeId) })
        const comSnap = await getDoc(comRef)
        const novoTotal = (comSnap.data().membrosCount || 0) + 1
        await updateDoc(comRef, { membrosCount: novoTotal })
      }
    } catch (e) {
      console.error("Erro na persistência:", e)
    }
  }

  const filtradas = comunidades.filter(c => 
    c.nome.toLowerCase().includes(busca.toLowerCase())
  )

  // ESTILOS DE ALTO CONTRASTE PARA OS CAMPOS
  const inputEstilo = {
    width: '100%',
    padding: '12px',
    marginBottom: '10px',
    borderRadius: '8px',
    border: '2px solid #333', // Borda escura para ver o campo
    backgroundColor: '#fff',
    color: '#000',
    fontSize: '16px',
    boxSizing: 'border-box'
  }

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <input 
          style={{ ...inputEstilo, marginBottom: 0, flex: 1 }}
          placeholder="Buscar comunidades..." 
          onChange={e => setBusca(e.target.value)}
        />
        <button 
          onClick={() => setCriando(!criando)}
          style={{ padding: '0 20px', background: '#002776', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {criando ? 'Cancelar' : '+ Criar'}
        </button>
      </div>

      {criando && (
        <div style={{ background: '#eee', padding: '20px', borderRadius: '12px', marginBottom: '20px', border: '1px solid #ccc' }}>
          <h3 style={{ color: '#000', marginTop: 0 }}>Criar nova</h3>
          
          <label style={{ fontWeight: 'bold', display: 'block', color: '#000' }}>Nome:</label>
          <input 
            style={inputEstilo}
            value={novaComunidade.nome}
            onChange={e => setNovaComunidade({...novaComunidade, nome: e.target.value})}
          />

          <label style={{ fontWeight: 'bold', display: 'block', color: '#000' }}>Categoria:</label>
          <input 
            style={inputEstilo}
            value={novaComunidade.categoria}
            onChange={e => setNovaComunidade({...novaComunidade, categoria: e.target.value})}
          />

          <label style={{ fontWeight: 'bold', display: 'block', color: '#000' }}>Emoji:</label>
          <input 
            style={inputEstilo}
            value={novaComunidade.emoji}
            onChange={e => setNovaComunidade({...novaComunidade, emoji: e.target.value})}
          />

          <button 
            onClick={criarComunidade}
            style={{ width: '100%', padding: '15px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            GRAVAR NO BANCO DE DADOS
          </button>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
        {filtradas.map(c => {
          const participando = minhasComunidades.includes(c.id)
          return (
            <div key={c.id} style={{ background: 'white', padding: '15px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 5px rgba(0,0,0,0.1)' }}>
              <div style={{ fontSize: '40px' }}>{c.emoji}</div>
              <h4 style={{ margin: '10px 0', color: '#000' }}>{c.nome}</h4>
              <p style={{ fontSize: '12px', color: '#666' }}>{c.membrosCount || 0} membros</p>
              <button 
                onClick={() => toggleParticipacao(c.id)}
                style={{ 
                  width: '100%', marginTop: '10px', padding: '8px', borderRadius: '6px', border: 'none',
                  background: participando ? '#ff4444' : '#002776',
                  color: 'white', cursor: 'pointer', fontWeight: 'bold'
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