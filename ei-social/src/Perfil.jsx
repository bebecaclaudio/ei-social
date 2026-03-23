import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuFoto, setMenuFoto] = useState(false)
  const LIMITE_BIO = 160

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: ''
  })

  const [foto, setFoto] = useState('')

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setDadosPerfil({
            nome: data.nome || usuario.displayName || usuario.email?.split('@')[0] || 'Usuario',
            bio: data.bio || '',
            local: data.local || ''
          })
          if (data.foto) setFoto(data.foto)
          else if (usuario.photoURL) setFoto(usuario.photoURL)
        } else {
          setDadosPerfil({
            nome: usuario.displayName || usuario.email?.split('@')[0] || 'Usuario',
            bio: '',
            local: ''
          })
          if (usuario.photoURL) setFoto(usuario.photoURL)
        }
      } catch (error) {
        console.error(error)
      }
      setCarregando(false)
    }
    carregarDados()
  }, [usuario])

  async function salvarAlteracoes() {
    if (!usuario?.uid) return
    if (dadosPerfil.bio.length > LIMITE_BIO) {
      alert('Sua bio está muito longa!')
      return
    }
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil, foto })
      setEditando(false)
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar')
    }
  }

  function handleFotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande! Máximo 2MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setFoto(ev.target.result)
      setMenuFoto(false)
    }
    reader.readAsDataURL(file)
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
          position: 'absolute',
          bottom: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 10
        }}>
          <div style={{
            width: '100px', height: '100px', borderRadius: '50%',
            background: 'white', border: '4px solid white',
            overflow: 'hidden', position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '60px'
          }}>
            {foto
              ? <img src={foto} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'
            }

            {/* BOTÃO CÂMERA */}
            <div
              onClick={() => setMenuFoto(!menuFoto)}
              style={{
                position: 'absolute', bottom: '4px', right: '4px',
                width: '28px', height: '28px', borderRadius: '50%',
                background: '#002776', color: 'white',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', fontSize: '14px',
                border: '2px solid white', zIndex: 11
              }}
            >📷</div>
          </div>

          {/* MENU FOTO */}
          {menuFoto && (
            <div style={{
              position: 'absolute', top: '110px', left: '50%',
              transform: 'translateX(-50%)',
              background: 'white', borderRadius: '12px', padding: '8px',
              boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', gap: '4px',
              minWidth: '140px', zIndex: 100
            }}>
              <label style={{
                cursor: 'pointer', fontSize: '13px', padding: '8px 12px',
                borderRadius: '8px', color: '#333', fontWeight: '600',
                background: '#f5f5f5', textAlign: 'center'
              }}>
                📤 Enviar foto
                <input
                  type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFotoUpload}
                />
              </label>
              {foto && (
                <button
                  onClick={() => { setFoto(''); setMenuFoto(false) }}
                  style={{
                    fontSize: '13px', padding: '8px 12px', borderRadius: '8px',
                    border: 'none', background: '#fff0f0', color: '#e00',
                    fontWeight: '600', cursor: 'pointer'
                  }}
                >❌ Remover foto</button>
              )}
              <button
                onClick={() => setMenuFoto(false)}
                style={{
                  fontSize: '12px', padding: '6px', borderRadius: '8px',
                  border: 'none', background: '#eee', color: '#888',
                  cursor: 'pointer'
                }}
              >Fechar</button>
            </div>
          )}
        </div>

        {/* BOTÃO EDITAR BIO */}
        <button
          onClick={() => setEditando(!editando)}
          style={{
            position: 'absolute', right: '20px', bottom: '20px',
            padding: '8px 18px', borderRadius: '20px', border: 'none',
            background: editando ? '#ff4444' : '#ffdf00',
            color: editando ? 'white' : '#002776',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
          }}
        >
          {editando ? '❌ Cancelar' : '✏️ Editar perfil'}
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ textAlign: 'center', marginTop: '64px', padding: '0 16px' }}>

        {/* NOME */}
        {editando ? (
          <input
            value={dadosPerfil.nome}
            onChange={(e) => setDadosPerfil({ ...dadosPerfil, nome: e.target.value })}
            style={{
              fontSize: '20px', textAlign: 'center', border: '2px solid #009c3b',
              borderRadius: '8px', padding: '8px 12px', outline: 'none',
              color: '#111', marginBottom: '10px', width: '80%'
            }}
          />
        ) : (
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#111', margin: '0 0 4px' }}>
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
              borderRadius: '8px', padding: '8px 12px', outline: 'none',
              color: '#111', marginBottom: '10px', width: '80%', display: 'block',
              margin: '8px auto'
            }}
          />
        ) : (
          dadosPerfil.local && (
            <p style={{ color: '#666', fontSize: '14px', margin: '4px 0' }}>
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
                width: '100%', padding: '10px 12px', borderRadius: '10px',
                border: '2px solid #009c3b', fontSize: '14px',
                resize: 'none', height: '80px', outline: 'none',
                color: '#111', boxSizing: 'border-box'
              }}
            />
            <span style={{
              fontSize: '11px', display: 'block', textAlign: 'right', marginTop: '2px',
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
          <button
            onClick={salvarAlteracoes}
            style={{
              background: '#009c3b', color: 'white', border: 'none',
              padding: '12px 32px', borderRadius: '20px', fontWeight: 'bold',
              cursor: 'pointer', marginTop: '12px', fontSize: '15px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          >
            💾 Salvar
          </button>
        )}
      </div>
    </div>
  )
}

export default Perfil