import { useState } from 'react'

function Comunidades() {
  const [comunidades, setComunidades] = useState([
    { id: 1, nome: 'Saudades do Orkut', membros: 4821, categoria: 'Nostalgia', emoji: '💾' },
    { id: 2, nome: 'Pagode e Samba', membros: 3200, categoria: 'Musica', emoji: '🎵' },
    { id: 3, nome: 'Receitas Brasileiras', membros: 2900, categoria: 'Gastronomia', emoji: '🍖' },
    { id: 4, nome: 'Filmes Nacionais', membros: 1500, categoria: 'Cinema', emoji: '🎬' },
    { id: 5, nome: 'Programadores BR', membros: 5100, categoria: 'Tecnologia', emoji: '💻' },
    { id: 6, nome: 'Futebol Brasileiro', membros: 9999, categoria: 'Esportes', emoji: '⚽' },
  ])

  const [minhasComunidades, setMinhasComunidades] = useState([1, 5])
  const [criando, setCriando] = useState(false)
  const [novaComunidade, setNovaComunidade] = useState({ nome: '', categoria: '', emoji: '' })
  const [busca, setBusca] = useState('')

  function entrarSair(id) {
    if (minhasComunidades.includes(id)) {
      setMinhasComunidades(minhasComunidades.filter(function(c) { return c !== id }))
      setComunidades(comunidades.map(function(c) {
        return c.id === id ? { ...c, membros: c.membros - 1 } : c
      }))
    } else {
      setMinhasComunidades([...minhasComunidades, id])
      setComunidades(comunidades.map(function(c) {
        return c.id === id ? { ...c, membros: c.membros + 1 } : c
      }))
    }
  }

  function criarComunidade() {
    if (novaComunidade.nome.trim() === '') return
    const nova = {
      id: Date.now(),
      nome: novaComunidade.nome,
      categoria: novaComunidade.categoria || 'Geral',
      emoji: novaComunidade.emoji || '⭐',
      membros: 1
    }
    setComunidades([nova, ...comunidades])
    setMinhasComunidades([...minhasComunidades, nova.id])
    setNovaComunidade({ nome: '', categoria: '', emoji: '' })
    setCriando(false)
  }

  const filtradas = comunidades.filter(function(c) {
    return c.nome.toLowerCase().includes(busca.toLowerCase())
  })

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <div style={{ maxWidth: '700px', margin: '24px auto', padding: '0 16px' }}>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
          <input
            placeholder="Buscar comunidade..."
            value={busca}
            onChange={function(e) { setBusca(e.target.value) }}
            style={{
              flex: 1, padding: '12px 18px', borderRadius: '12px',
              border: '2px solid #ddd', fontSize: '15px', outline: 'none', color: '#333'
            }}
          />
          <button onClick={function() { setCriando(true) }} style={{
            padding: '12px 20px', borderRadius: '12px', border: 'none',
            background: 'linear-gradient(90deg, #002776, #009c3b)',
            color: 'white', fontWeight: '800', fontSize: '15px', cursor: 'pointer'
          }}>+ Criar</button>
        </div>

        {criando && (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '24px',
            marginBottom: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
            border: '2px solid #009c3b'
          }}>
            <h3 style={{ marginBottom: '16px', color: '#002776' }}>Nova Comunidade</h3>
            <input
              placeholder="Nome da comunidade"
              value={novaComunidade.nome}
              onChange={function(e) { setNovaComunidade({ ...novaComunidade, nome: e.target.value }) }}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                marginBottom: '12px', color: '#333', boxSizing: 'border-box'
              }}
            />
            <input
              placeholder="Categoria (ex: Musica, Esportes...)"
              value={novaComunidade.categoria}
              onChange={function(e) { setNovaComunidade({ ...novaComunidade, categoria: e.target.value }) }}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                marginBottom: '12px', color: '#333', boxSizing: 'border-box'
              }}
            />
            <input
              placeholder="Emoji (ex: 🎸)"
              value={novaComunidade.emoji}
              onChange={function(e) { setNovaComunidade({ ...novaComunidade, emoji: e.target.value }) }}
              style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '15px', outline: 'none',
                marginBottom: '16px', color: '#333', boxSizing: 'border-box'
              }}
            />
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={criarComunidade} style={{
                flex: 1, padding: '12px', borderRadius: '10px', border: 'none',
                background: '#ffdf00', color: '#002776', fontWeight: '800',
                fontSize: '15px', cursor: 'pointer'
              }}>Criar!</button>
              <button onClick={function() { setCriando(false) }} style={{
                flex: 1, padding: '12px', borderRadius: '10px',
                border: '2px solid #ddd', background: 'white',
                color: '#555', fontWeight: '700', fontSize: '15px', cursor: 'pointer'
              }}>Cancelar</button>
            </div>
          </div>
        )}

        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#002776', marginBottom: '12px' }}>
          Minhas Comunidades
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '28px' }}>
          {filtradas.filter(function(c) { return minhasComunidades.includes(c.id) }).map(function(c) {
            return (
              <div key={c.id} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)', border: '2px solid #009c3b'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{c.emoji}</div>
                <p style={{ fontWeight: '800', fontSize: '15px', color: '#222' }}>{c.nome}</p>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 12px' }}>
                  {c.membros.toLocaleString()} membros • {c.categoria}
                </p>
                <button onClick={function() { entrarSair(c.id) }} style={{
                  width: '100%', padding: '8px', borderRadius: '8px',
                  border: '2px solid #e00', background: 'white',
                  color: '#e00', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}>Sair</button>
              </div>
            )
          })}
        </div>

        <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#002776', marginBottom: '12px' }}>
          Descobrir Comunidades
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          {filtradas.filter(function(c) { return !minhasComunidades.includes(c.id) }).map(function(c) {
            return (
              <div key={c.id} style={{
                background: 'white', borderRadius: '16px', padding: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
              }}>
                <div style={{ fontSize: '40px', marginBottom: '8px' }}>{c.emoji}</div>
                <p style={{ fontWeight: '800', fontSize: '15px', color: '#222' }}>{c.nome}</p>
                <p style={{ color: '#888', fontSize: '13px', margin: '4px 0 12px' }}>
                  {c.membros.toLocaleString()} membros • {c.categoria}
                </p>
                <button onClick={function() { entrarSair(c.id) }} style={{
                  width: '100%', padding: '8px', borderRadius: '8px', border: 'none',
                  background: 'linear-gradient(90deg, #002776, #009c3b)',
                  color: 'white', fontWeight: '700', fontSize: '13px', cursor: 'pointer'
                }}>Participar</button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default Comunidades