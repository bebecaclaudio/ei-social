import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const LIMITE_BIO = 160

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: usuario?.displayName || usuario?.email?.split('@')[0] || 'Usuario',
    bio: '',
    local: ''
  })

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) setDadosPerfil(docSnap.data())
      } catch (error) { console.error(error) }
      setCarregando(false)
    }
    carregarDados()
  }, [usuario])

  async function salvarAlteracoes() {
    if (dadosPerfil.bio.length > LIMITE_BIO) {
      alert('Sua bio está muito longa!')
      return
    }
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid), dadosPerfil)
      setEditando(false)
    } catch (e) { alert('Erro ao salvar') }
  }

  if (carregando) return (
    <div style={{ textAlign: 'center', padding: '50px', color: '#333' }}>
      Carregando...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>

      {/* BANNER */}
      <div style={{
        height: '200px',
        background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)',
        position: 'relative'
      }}>
        {/* AVATAR */}
        <div style={{
          position: 'absolute', bottom: '-50px', left: '50%',
          transform: 'translateX(-50%)', width: '100px', height: '100px',
          borderRadius: '50%', background: 'white', border: '4px solid white',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '60px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          {usuario?.photoURL
            ? <img src={usuario.photoURL} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            : '👤'
          }
        </div>

        {/* BOTÃO EDITAR */}
        <button
          onClick={() => setEditando(!editando)}
          style={{
            position: 'absolute', right: '20px', bottom: '20px',
            padding: '8px 18px', borderRadius: '20px', border: 'none',
            background: editando ? '#ff4444' : '#ffdf00',
            color: editando ? 'white' : '#002776',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}>
          {editando ? '❌ Cancelar' : '✏️ Editar Bio'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 16px' }}>

        {/* NOME */}
        {editando ? (
          <input
            value={dadosPerfil.nome}
            onChange={(e) => setDadosPerfil({ ...dadosPerfil, nome: e.target.value })}
            style={{
              fontSize: '20px', textAlign: 'center', border: '2px solid #009c3b',
              borderRadius: '8px', padding: '8px', width: '80%',
              outline: 'none', color: '#111', marginBottom: '12px'
            }}
          />
        ) : (
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111' }}>
            {dadosPerfil.nome}
          </h2>
        )}

        {/* LOCAL */}
        {editando ? (
          <input
            value={dadosPerfil.local}
            placeholder="Sua cidade..."
            onChange={(e) => setDadosPerfil({ ...dadosPerfil, local: e.target.value })}
            style={{
              fontSize: '14px', textAlign: 'center', border: '2px solid #ddd',
              borderRadius: '8px', padding: '8px', width: '80%',
              outline: 'none', color: '#111', marginBottom: '12px', display: 'block',
              margin: '8px auto'
            }}
          />
        ) : (
          dadosPerfil.local && (
            <p style={{ color: '#666', fontSize: '14px', marginTop: '4px' }}>
              📍 {dadosPerfil.local}
            </p>
          )
        )}

        {/* BIO */}
        {editando ? (
          <div style={{ maxWidth: '400px', margin: '12px auto' }}>
            <textarea
              maxLength={LIMITE_BIO}
              value={dadosPerfil.bio}
              onChange={(e) => setDadosPerfil({ ...dadosPerfil, bio: e.target.value })}
              placeholder="Escreva algo sobre você..."
              style={{
                width: '100%', padding: '10px', borderRadius: '8px',
                border: '2px solid #009c3b', fontSize: '14px',
                resize: 'none', height: '80px', boxSizing: 'border-box',
                outline: 'none', color: '#111'
              }}
            />
            <span style={{
              fontSize: '11px', display: 'block', textAlign: 'right', marginTop: '4px',
              color: dadosPerfil.bio.length >= LIMITE_BIO ? 'red' : '#888'
            }}>
              {dadosPerfil.bio.length} / {LIMITE_BIO}
            </span>
          </div>
        ) : (
          <p style={{ color: '#444', fontSize: '15px', margin: '12px auto', maxWidth: '400px' }}>
            {dadosPerfil.bio || 'Escreva algo sobre você!'}
          </p>
        )}

        {editando && (
          <button onClick={salvarAlteracoes} style={{
            background: '#009c3b', color: 'white', border: 'none',
            padding: '12px 32px', borderRadius: '20px', fontWeight: 'bold',
            cursor: 'pointer', marginTop: '12px', fontSize: '15px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            💾 Salvar
          </button>
        )}
      </div>
    </div>
  )
}

export default Perfil