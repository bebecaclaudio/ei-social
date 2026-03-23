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
      await setDoc(doc(db, 'usuarios', usuario.uid), {
        ...dadosPerfil,
        foto
      })

      setEditando(false)
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar')
    }
  }

  function handleFotoUpload(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setFoto(ev.target.result)
      setMenuFoto(false)
    }

    reader.readAsDataURL(file)
  }

  if (carregando) {
    return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

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
          transform: 'translateX(-50%)'
        }}>

          <div
            className="avatar-hover"
            style={{
              width: '110px',
              height: '110px',
              borderRadius: '50%',
              background: 'white',
              border: '4px solid white',
              overflow: 'hidden',
              position: 'relative',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '50px'
            }}
          >

            {foto ? (
              <img
                src={foto}
                alt="Foto"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : '👤'}

            {/* OVERLAY CAMERA */}
            <div
              onClick={() => setMenuFoto(!menuFoto)}
              className="camera-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(0,0,0,0.5)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                opacity: 0,
                transition: '0.3s',
                cursor: 'pointer'
              }}
            >
              📷
            </div>
          </div>

          {/* MENU FOTO */}
          {menuFoto && (
            <div style={{
              marginTop: '10px',
              background: 'white',
              borderRadius: '10px',
              padding: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <label style={{ cursor: 'pointer', fontSize: '12px' }}>
                📤 Enviar foto
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleFotoUpload}
                />
              </label>

              {foto && (
                <button onClick={() => setFoto('')}>
                  ❌ Remover
                </button>
              )}
            </div>
          )}
        </div>

        {/* BOTÃO EDITAR */}
        <button
          onClick={() => setEditando(!editando)}
          style={{
            position: 'absolute',
            right: '20px',
            bottom: '20px',
            padding: '8px 18px',
            borderRadius: '20px',
            border: 'none',
            background: editando ? '#ff4444' : '#ffdf00',
            color: editando ? 'white' : '#002776',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          {editando ? '❌ Cancelar' : '✏️ Editar'}
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ textAlign: 'center', marginTop: '60px' }}>
        <h2>{dadosPerfil.nome}</h2>
        {dadosPerfil.local && <p>📍 {dadosPerfil.local}</p>}
        <p>{dadosPerfil.bio || 'Escreva algo sobre você!'}</p>
      </div>
    </div>
  )
}

export default Perfil