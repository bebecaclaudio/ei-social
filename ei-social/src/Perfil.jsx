import { useState } from 'react'

function Perfil({ onVoltar }) {
  const [abaSelecionada, setAbaSelecionada] = useState('posts')

  const posts = [
    { id: 1, texto: 'Saudades do Orkut!', curtidas: 42 },
    { id: 2, texto: 'Ei e a melhor rede social BR!', curtidas: 87 },
  ]

  const depoimentos = [
    { id: 1, autor: 'Joao Santos', texto: 'Pessoa incrivel, amigo de verdade!' },
    { id: 2, autor: 'Ana Costa', texto: 'Melhor pessoa que conheco!' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      <div style={{
        background: 'linear-gradient(90deg, #002776, #009c3b)',
        padding: '12px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <h1 onClick={onVoltar} style={{ color: 'white', fontSize: '28px', fontWeight: '900', cursor: 'pointer' }}>Ei</h1>
        <input placeholder="Buscar..." style={{
          padding: '8px 16px', borderRadius: '20px',
          border: 'none', width: '200px', fontSize: '14px'
        }} />
        <div style={{ color: 'white', fontSize: '22px', cursor: 'pointer' }}>👤</div>
      </div>

      <div style={{
        height: '200px',
        background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)',
        position: 'relative'
      }}>
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          background: 'white',
          border: '4px solid white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '60px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
        }}>
          👤
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 16px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#222' }}>Sofia Rebeca</h2>
        <p style={{ color: '#666', fontSize: '15px', marginTop: '4px' }}>Botucatu, SP - Entrou em 2024</p>
        <p style={{ color: '#444', fontSize: '15px', margin: '12px auto', maxWidth: '400px' }}>
          Apaixonada por tecnologia e nostalgia digital
        </p>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '16px 0' }}>
          {[['128', 'Amigos'], ['34', 'Posts'], ['12', 'Comunidades']].map(function(item) {
            return (
              <div key={item[1]} style={{ textAlign: 'center' }}>
                <p style={{ fontWeight: '800', fontSize: '20px', color: '#002776' }}>{item[0]}</p>
                <p style={{ color: '#888', fontSize: '13px' }}>{item[1]}</p>
              </div>
            )
          })}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', margin: '16px 0' }}>
          <button style={{
            padding: '10px 28px', borderRadius: '24px', border: 'none',
            background: 'linear-gradient(90deg, #002776, #009c3b)',
            color: 'white', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
          }}>+ Adicionar amigo</button>
          <button style={{
            padding: '10px 28px', borderRadius: '24px',
            border: '2px solid #ffdf00', background: 'white',
            color: '#002776', fontWeight: '700', fontSize: '14px', cursor: 'pointer'
          }}>Mandar um Ei!</button>
        </div>
      </div>

      <div style={{
        display: 'flex', justifyContent: 'center', gap: '8px',
        margin: '24px auto 0', borderBottom: '2px solid #ddd',
        maxWidth: '600px'
      }}>
        {['posts', 'depoimentos', 'amigos'].map(function(aba) {
          return (
            <button key={aba} onClick={function() { setAbaSelecionada(aba) }} style={{
              padding: '10px 24px', border: 'none', background: 'none',
              fontWeight: '700', fontSize: '15px', cursor: 'pointer',
              color: abaSelecionada === aba ? '#009c3b' : '#888',
              borderBottom: abaSelecionada === aba ? '3px solid #009c3b' : '3px solid transparent',
              textTransform: 'capitalize'
            }}>{aba}</button>
          )
        })}
      </div>

      <div style={{ maxWidth: '600px', margin: '16px auto', padding: '0 16px' }}>

        {abaSelecionada === 'posts' && posts.map(function(post) {
          return (
            <div key={post.id} style={{
              background: 'white', borderRadius: '16px',
              padding: '20px', marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <p style={{ fontSize: '15px', color: '#333' }}>{post.texto}</p>
              <p style={{ color: '#009c3b', fontWeight: '700', marginTop: '10px', fontSize: '14px' }}>
                {post.curtidas} curtidas
              </p>
            </div>
          )
        })}

        {abaSelecionada === 'depoimentos' && (
          <div>
            <div style={{
              background: 'white', borderRadius: '16px',
              padding: '20px', marginBottom: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
            }}>
              <textarea placeholder="Deixe um depoimento..." style={{
                width: '100%', padding: '12px', borderRadius: '10px',
                border: '1px solid #ddd', fontSize: '14px',
                resize: 'none', height: '80px', outline: 'none'
              }} />
              <button style={{
                marginTop: '8px', padding: '10px 24px', borderRadius: '10px',
                border: 'none', background: '#ffdf00', color: '#002776',
                fontWeight: '800', cursor: 'pointer'
              }}>Enviar depoimento</button>
            </div>

            {depoimentos.map(function(dep) {
              return (
                <div key={dep.id} style={{
                  background: 'white', borderRadius: '16px',
                  padding: '20px', marginBottom: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <p style={{ fontWeight: '700', color: '#002776', marginBottom: '6px' }}>
                    {dep.autor}
                  </p>
                  <p style={{ color: '#444', fontSize: '15px' }}>{dep.texto}</p>
                </div>
              )
            })}
          </div>
        )}

        {abaSelecionada === 'amigos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            {['Joao Santos', 'Ana Costa', 'Pedro Lima', 'Carla Souza'].map(function(nome) {
              return (
                <div key={nome} style={{
                  background: 'white', borderRadius: '16px',
                  padding: '16px', textAlign: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}>👤</div>
                  <p style={{ fontWeight: '700', fontSize: '14px', color: '#222' }}>{nome}</p>
                  <button style={{
                    marginTop: '8px', padding: '6px 16px', borderRadius: '20px',
                    border: '2px solid #009c3b', background: 'white',
                    color: '#009c3b', fontWeight: '700', fontSize: '12px', cursor: 'pointer'
                  }}>Ver perfil</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Perfil