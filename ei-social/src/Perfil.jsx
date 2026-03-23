import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { db, storage } from './firebase-config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [abrirOpcoes, setAbrirOpcoes] = useState(false)

  const [imagemOriginal, setImagemOriginal] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [blobFinal, setBlobFinal] = useState(null)

  const fileInputRef = useRef(null)

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: '',
    fotoUrl: ''
  })

  // 🔄 carregar perfil
  useEffect(() => {
    let ativo = true

    async function inicializar() {
      if (!usuario?.uid) return

      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)

        if (!ativo) return

        if (docSnap.exists()) {
          const d = docSnap.data()
          setDadosPerfil({
            nome: d.nome || usuario.displayName || '',
            bio: d.bio || '',
            local: d.local || '',
            fotoUrl: d.fotoUrl || usuario.photoURL || ''
          })
        } else {
          const inicial = {
            nome: usuario.displayName || 'Membro',
            bio: 'Busco conhecimento e evolução.',
            local: 'Brasil',
            fotoUrl: usuario.photoURL || '',
            criadoEm: serverTimestamp()
          }

          await setDoc(docRef, inicial)
          if (ativo) setDadosPerfil(inicial)
        }
      } catch (err) {
        console.error(err)
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    inicializar()
    return () => { ativo = false }
  }, [usuario])

  // limpar blob
  useEffect(() => {
    return () => {
      if (dadosPerfil.fotoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(dadosPerfil.fotoUrl)
      }
    }
  }, [dadosPerfil.fotoUrl])

  // upload imagem
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Arquivo inválido')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Máx 5MB')
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => {
      setImagemOriginal(reader.result)
      setAbrirOpcoes(false)
    }
  }

  const aoTerminarRecorte = useCallback((_, pixels) => {
    setCroppedAreaPixels(pixels)
  }, [])

  const aplicarRecorte = async () => {
    if (!croppedAreaPixels) return

    const blob = await processarImagem(imagemOriginal, croppedAreaPixels)
    if (!blob) return

    const url = URL.createObjectURL(blob)

    setBlobFinal(blob)
    setDadosPerfil(prev => ({ ...prev, fotoUrl: url }))
    setImagemOriginal(null)
  }

  const handleSave = async () => {
    if (!usuario?.uid) return

    setSalvando(true)

    try {
      let urlFinal = dadosPerfil.fotoUrl

      if (blobFinal) {
        const storageRef = ref(storage, `perfis/${usuario.uid}/avatar.jpg`)
        await uploadBytes(storageRef, blobFinal)
        urlFinal = await getDownloadURL(storageRef)
      }

      await setDoc(doc(db, 'usuarios', usuario.uid), {
        nome: dadosPerfil.nome,
        bio: dadosPerfil.bio,
        local: dadosPerfil.local,
        fotoUrl: urlFinal,
        modificadoEm: serverTimestamp()
      }, { merge: true })

      setDadosPerfil(prev => ({ ...prev, fotoUrl: urlFinal }))
      setBlobFinal(null)
      setEditando(false)

      alert('Perfil atualizado ✨')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div style={fullCenterStyle}>Carregando...</div>
  }

  return (
    <div style={containerStyle}>
      <style>{`.avatar-wrapper:hover .camera-icon { opacity: 1 !important; }`}</style>

      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* MODAL OPÇÕES */}
      {abrirOpcoes && (
        <div style={overlayStyle} onClick={() => setAbrirOpcoes(false)}>
          <div style={modalBoxStyle} onClick={e => e.stopPropagation()}>
            <button style={btnActionStyle} onClick={() => fileInputRef.current.click()}>
              Subir foto
            </button>

            {dadosPerfil.fotoUrl && (
              <button
                style={{ ...btnActionStyle, color: '#ff4444' }}
                onClick={() => {
                  setDadosPerfil(p => ({ ...p, fotoUrl: '' }))
                  setBlobFinal(null)
                  setAbrirOpcoes(false)
                }}
              >
                Remover
              </button>
            )}

            <button style={btnSimpleStyle} onClick={() => setAbrirOpcoes(false)}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* MODAL CROP */}
      {imagemOriginal && (
        <div style={overlayStyle}>
          <div style={{ ...modalBoxStyle, padding: 0, maxWidth: 400 }}>
            <div style={{ position: 'relative', height: 300 }}>
              <Cropper
                image={imagemOriginal}
                crop={crop}
                zoom={zoom}
                aspect={1}
                cropShape="round"
                onCropChange={setCrop}
                onCropComplete={aoTerminarRecorte}
                onZoomChange={(z) => setZoom(Number(z))}
              />
            </div>

            <div style={{ padding: 20 }}>
              <input
                type="range"
                min={1}
                max={3}
                step={0.1}
                value={zoom}
                onChange={e => setZoom(Number(e.target.value))}
                style={{ width: '100%' }}
              />

              <button style={btnConfirmStyle} onClick={aplicarRecorte}>
                Confirmar
              </button>

              <button style={btnSimpleStyle} onClick={() => setImagemOriginal(null)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={bannerStyle}>
        <div
          className="avatar-wrapper"
          style={avatarWrapperStyle}
          onClick={() => setAbrirOpcoes(true)}
        >
          {dadosPerfil.fotoUrl ? (
            <img src={dadosPerfil.fotoUrl} alt="User" style={imgFitStyle} />
          ) : (
            <span style={{ fontSize: 'clamp(28px, 6vw, 40px)' }}>👤</span>
          )}
          <div className="camera-icon" style={cameraOverlayStyle}>📷</div>
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={contentBodyStyle}>
        {editando ? (
          <div style={editFormStyle}>
            <input
              style={inputStyle}
              value={dadosPerfil.nome}
              onChange={e => setDadosPerfil({ ...dadosPerfil, nome: e.target.value })}
            />

            <input
              style={inputStyle}
              value={dadosPerfil.local}
              onChange={e => setDadosPerfil({ ...dadosPerfil, local: e.target.value })}
            />

            <textarea
              style={textareaStyle}
              value={dadosPerfil.bio}
              onChange={e => setDadosPerfil({ ...dadosPerfil, bio: e.target.value })}
            />

            <button style={btnConfirmStyle} onClick={handleSave} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        ) : (
          <>
            <h1 style={userNameStyle}>{dadosPerfil.nome}</h1>
            <p style={userLocalStyle}>📍 {dadosPerfil.local}</p>
            <p style={userBioStyle}>{dadosPerfil.bio}</p>

            <button style={btnEditStyle} onClick={() => setEditando(true)}>
              Editar perfil
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// 🎨 estilos responsivos + contraste

const containerStyle = {
  minHeight: '100vh',
  background: '#f7f7f7',
  padding: '0 16px',
  fontFamily: 'sans-serif'
}

const bannerStyle = {
  height: 'clamp(140px, 25vw, 220px)',
  background: 'linear-gradient(90deg, #002776, #009c3b)',
  position: 'relative',
  display: 'flex',
  justifyContent: 'center'
}

const avatarWrapperStyle = {
  position: 'absolute',
  bottom: 'clamp(-50px, -8vw, -70px)',
  width: 'clamp(90px, 25vw, 130px)',
  height: 'clamp(90px, 25vw, 130px)',
  borderRadius: '50%',
  background: '#fff',
  border: '4px solid #fff',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const imgFitStyle = { width: '100%', height: '100%', objectFit: 'cover' }

const contentBodyStyle = {
  marginTop: 'clamp(60px, 12vw, 90px)',
  textAlign: 'center'
}

const userNameStyle = {
  fontSize: 'clamp(22px, 5vw, 32px)',
  fontWeight: '900',
  color: '#0a0a0a'
}

const userLocalStyle = {
  fontSize: 'clamp(14px, 3.5vw, 18px)',
  color: '#005c23'
}

const userBioStyle = {
  fontSize: 'clamp(14px, 3.8vw, 16px)',
  color: '#222',
  maxWidth: '600px',
  margin: '10px auto'
}

const btnEditStyle = {
  padding: '12px 24px',
  background: '#ffdf00',
  border: 'none',
  borderRadius: '30px',
  cursor: 'pointer'
}

const overlayStyle = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.8)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

const modalBoxStyle = {
  background: '#fff',
  padding: '20px',
  borderRadius: '20px'
}

const btnActionStyle = {
  width: '100%',
  padding: '12px',
  margin: '5px 0'
}

const btnConfirmStyle = {
  width: '100%',
  padding: '12px',
  background: '#009c3b',
  color: '#fff',
  border: 'none',
  borderRadius: '10px'
}

const btnSimpleStyle = {
  background: 'none',
  border: 'none',
  marginTop: '10px'
}

const editFormStyle = {
  maxWidth: '400px',
  margin: '0 auto'
}

const inputStyle = {
  width: '100%',
  padding: '10px',
  marginBottom: '10px'
}

const textareaStyle = {
  ...inputStyle,
  height: '80px'
}

const fullCenterStyle = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

// 🖼️ crop
async function processarImagem(src, crop) {
  const img = new Image()
  img.src = src

  await new Promise((res) => (img.onload = res))

  const canvas = document.createElement('canvas')
  canvas.width = crop.width
  canvas.height = crop.height

  const ctx = canvas.getContext('2d')
  ctx.drawImage(
    img,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  )

  return new Promise((res) => canvas.toBlob(res, 'image/jpeg', 0.9))
}

export default Perfil