import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import Cropper from 'react-easy-crop'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const LIMITE_BIO = 160

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: ''
  })

  // FOTO
  const [foto, setFoto] = useState('')
  const [menuFoto, setMenuFoto] = useState(false)

  // CROP
  const [imagemTemp, setImagemTemp] = useState(null)
  const [mostrarCrop, setMostrarCrop] = useState(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)

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
        } else {
          setDadosPerfil({
            nome: usuario.displayName || usuario.email?.split('@')[0] || 'Usuario',
            bio: '',
            local: ''
          })
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

  if (carregando) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        Carregando...
      </div>
    )
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

          <div style={{
            width: '100px',
            height: '100px',
            borderRadius: '50%',
            background: 'white',
            border: '4px solid white',
            overflow: 'hidden',
            position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}>

            {foto ? (
              <img
                src={foto}
                alt="Foto de perfil"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : '👤'}

            {/* BOTÃO FOTO AJUSTADO */}
            <div
              onClick={() => setMenuFoto(!menuFoto)}
              style={{
                position: 'absolute',
                bottom: '6px',
                right: '6px',
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: '#000',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '16px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                border: '2px solid white'
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
                  onChange={(e) => {
                    const file = e.target.files[0]
                    if (file) {
                      const url = URL.createObjectURL(file)
                      setImagemTemp(url)
                      setMostrarCrop(true)
                      setMenuFoto(false)
                    }
                  }}
                />
              </label>

              <button
                onClick={() => setFoto('')}
                style={{ fontSize: '12px', cursor: 'pointer' }}
              >
                ❌ Remover
              </button>

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
          {editando ? '❌ Cancelar' : '✏️ Editar Bio'}
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ textAlign: 'center', marginTop: '60px' }}>

        {editando ? (
          <input
            value={dadosPerfil.nome}
            onChange={(e) => setDadosPerfil({ ...dadosPerfil, nome: e.target.value })}
          />
        ) : (
          <h2>{dadosPerfil.nome}</h2>
        )}

        {editando ? (
          <input
            value={dadosPerfil.local}
            onChange={(e) => setDadosPerfil({ ...dadosPerfil, local: e.target.value })}
          />
        ) : (
          dadosPerfil.local && <p>📍 {dadosPerfil.local}</p>
        )}

        {editando ? (
          <textarea
            maxLength={LIMITE_BIO}
            value={dadosPerfil.bio}
            onChange={(e) => setDadosPerfil({ ...dadosPerfil, bio: e.target.value })}
          />
        ) : (
          <p>{dadosPerfil.bio || 'Escreva algo sobre você!'}</p>
        )}

        {editando && (
          <button onClick={salvarAlteracoes}>
            💾 Salvar
          </button>
        )}
      </div>

      {/* MODAL CROP */}
      {mostrarCrop && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: '#000000cc',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999
        }}>

          <div style={{ width: '300px', height: '300px', position: 'relative' }}>
            <Cropper
              image={imagemTemp}
              crop={crop}
              zoom={zoom}
              aspect={1}
              cropShape="round"
              onCropChange={setCrop}
              onZoomChange={(z) => setZoom(Number(z))}
            />
          </div>

          <div style={{ position: 'absolute', bottom: '40px' }}>
            <input
              type="range"
              min={1}
              max={3}
              step={0.1}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
            />

            <button onClick={() => {
              setFoto(imagemTemp)
              setMostrarCrop(false)
            }}>
              Salvar
            </button>
          </div>

        </div>
      )}
    </div>
  )
}

export default Perfil