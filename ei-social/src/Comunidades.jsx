import React, { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { useNavigate } from 'react-router-dom'
import {
  collection, addDoc, onSnapshot, doc, 
  query, orderBy, setDoc, increment, arrayUnion, arrayRemove, deleteDoc,
  serverTimestamp
} from 'firebase/firestore'

function Comunidades({ usuario }) {
  const navigate = useNavigate()
  const [comunidades, setComunidades] = useState([])
  const [minhasComunidades, setMinhasComunidades] = useState([])
  const [criando, setCriando] = useState(false)
  const [busca, setBusca] = useState('')
  
  const [novaComunidade, setNovaComunidade] = useState({ 
    nome: '', 
    slug: '', 
    descricao: '', 
    categoria: '', 
    emoji: '' 
  })

  // FUNÇÃO AUXILIAR: Transforma "Minha Comunidade" em "minha-comunidade"
  const formatarSlug = (texto) => {
    return texto
      .toLowerCase()
      .trim()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, "") // Remove acentos
      .replace(/\s+/g, '-') // Espaços viram hífens
      .replace(/[^\w-]+/g, '') // Remove caracteres especiais
      .replace(/--+/g, '-'); // Evita hífens duplos
  }

  // Busca lista geral de comunidades
  useEffect(() => {
    const q = query(collection(db, 'comunidades'), orderBy('dataCriacao', 'desc'))
    const unsub = onSnapshot(q, (snapshot) => {
      setComunidades(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
    })
    return () => unsub()
  }, [])

  // Busca comunidades que o usuário participa
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
    const nomeLimpo = novaComunidade.nome.trim();
    if (!nomeLimpo || !usuario?.uid) {
      alert("Por favor, preencha o nome e verifique seu login.")
      return
    }

    // Garante que temos um slug antes de enviar
    const slugFinal = novaComunidade.slug || formatarSlug(nomeLimpo);

    try {
      // 1. Cria a comunidade
      const docRef = await addDoc(collection(db, 'comunidades'), {
        nome: nomeLimpo,
        slug: slugFinal,
        descricao: novaComunidade.descricao,
        categoria: novaComunidade.categoria || 'Geral',
        emoji: novaComunidade.emoji || '👥',
        membrosCount: 1,
        criadoPor: usuario.uid,
        dataCriacao: serverTimestamp() 
      })

      // 2. Adiciona o criador como primeiro membro na subcoleção
      await setDoc(doc(db, 'comunidades', docRef.id, 'membros', usuario.uid), {
        uid: usuario.uid,
        desde: serverTimestamp()
      })

      // 3. Adiciona a ID da comunidade no perfil do usuário
      await setDoc(doc(db, 'usuarios', usuario.uid), {
        comunidadesInscritas: arrayUnion(docRef.id)
      }, { merge: true })

      // Reseta o estado e navega
      setNovaComunidade({ nome: '', slug: '', descricao: '', categoria: '', emoji: '' })
      setCriando(false)
      
      // Navega usando o slug para a URL ficar amigável
      navigate(`/comunidades/${slugFinal}`)

    } catch (e) { 
      console.error("Erro ao salvar:", e)
      alert("Houve um erro ao criar a comunidade.")
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
        await setDoc(membroRef, { uid: usuario.uid, desde: serverTimestamp() })
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
      
      {/* BARRA DE PESQUISA E BOTÃO NOVO */}
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

      {/* FORMULÁRIO DE CRIAÇÃO */}
      {criando && (
        <div style={{ background: '#f9f9f9', padding: '20px', borderRadius: '12px', marginBottom: '30px', border: '2px solid #009c3b', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
          <h3 style={{ marginTop: 0, color: '#002776' }}>Criar nova egrégora</h3>
          
          <label style={s.label}>Nome da Comunidade</label>
          <input 
            style={s.input} 
            value={novaComunidade.nome} 
            placeholder="Ex: Alquimia das Flores" 
            onChange={e => {
              const nome = e.target.value
              setNovaComunidade({
                ...novaComunidade, 
                nome: nome,
                slug: formatarSlug(nome)
              })
            }} 
          />
          
          <p style={{ fontSize: '11px', color: '#666', marginTop: '-5px', marginBottom: '10px' }}>
            Link permanente: /comunidades/<strong>{novaComunidade.slug || '...'}</strong>
          </p>

          <label style={s.label}>Descrição</label>
          <textarea 
            style={{ ...s.input, height: '80px', fontFamily: 'inherit' }} 
            value={novaComunidade.descricao} 
            placeholder="Qual o propósito deste espaço?" 
            onChange={e => setNovaComunidade({...novaComunidade, descricao: e.target.value})} 
          />
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <div style={{ flex: 1 }}>
              <label style={s.label}>Categoria</label>
              <input style={s.input} value={novaComunidade.categoria} placeholder="Ex: Gastronomia" onChange={e => setNovaComunidade({...novaComunidade, categoria: e.target.value})} />
            </div>
            <div style={{ width: '90px' }}>
              <label style={s.label}>Emoji</label>
              <input style={s.input} value={novaComunidade.emoji} placeholder="🌸" onChange={e => setNovaComunidade({...novaComunidade, emoji: e.target.value})} />
            </div>
          </div>
          
          <button onClick={salvarComunidade} style={{ width: '100%', padding: '12px', background: '#009c3b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
            Criar e Ingressar
          </button>
        </div>
      )}

      {/* GRID DE LISTAGEM */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '15px' }}>
        {filtradas.map(c => {
          const participando = minhasComunidades.includes(c.id)
          return (
            <div key={c.id} style={{ background: 'white', padding: '20px', borderRadius: '15px', border: participando ? '2px solid #009c3b' : '1px solid #ddd', textAlign: 'center' }}>
              
              <div 
                onClick={() => navigate(`/comunidades/${c.slug || c.id}`)} 
                style={{ cursor: 'pointer' }}
              >
                <div style={{ fontSize: '40px', marginBottom: '10px' }}>{c.emoji || '👥'}</div>
                <h4 style={{ margin: '5px 0', fontSize: '16px', color: '#1a1a1a' }}>{c.nome}</h4>
              </div>

              <p style={{ fontSize: '12px', color: '#666', marginBottom: '15px' }}>{c.membrosCount || 0} membros</p>
              
              <button 
                onClick={(e) => {
                  e.stopPropagation() 
                  toggleParticipacao(c.id, participando)
                }}
                style={{ 
                  width: '100%', 
                  padding: '8px', 
                  borderRadius: '6px', 
                  border: 'none', 
                  background: participando ? '#f0f0f0' : '#002776', 
                  color: participando ? '#555' : 'white', 
                  cursor: 'pointer', 
                  fontWeight: 'bold', 
                  fontSize: '13px' 
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