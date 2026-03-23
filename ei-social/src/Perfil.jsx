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
    async function inicializar() {
      if (!usuario?.uid) return

      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)

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
            nome: usuario.displayName || 'Membro Pleiadians',
            bio: 'Sou polimata e busco conhecimento.',
            local: 'Brasil',
            fotoUrl: usuario.photoURL || '',
            criadoEm: serverTimestamp()
          }

          await setDoc(docRef, inicial)
          setDadosPerfil(inicial)
        }
      } catch (err) {
        console.error(err)
      } finally {
        setCarregando(false)
      }
    }

    inicializar()
  }, [usuario])

  // 🧹 limpar blob da memória
  useEffect(() => {
    return () => {
      if (dadosPerfil.fotoUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(dadosPerfil.fotoUrl)
      }
    }
  }, [dadosPerfil.fotoUrl])

  // 📸 upload imagem com validação
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Escolha uma imagem válida.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Imagem muito grande (máx 5MB).')
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
    const blob = await processarImagem(imagemOriginal, croppedAreaPixels)
    if (!blob) return

    setBlobFinal(blob)
    setDadosPerfil(prev => ({
      ...prev,
      fotoUrl: URL.createObjectURL(blob)
    }))
    setImagemOriginal(null)
  }

  // 💾 salvar perfil
  const handleSave = async () => {
    if (!usuario?.uid) return

    setSalvando(true)

    try {
      let urlDefinitiva = dadosPerfil.fotoUrl

      if (blobFinal) {
        const storageRef = ref(storage, `perfis/${usuario.uid}/avatar.jpg`)
        await uploadBytes(storageRef, blobFinal)
        urlDefinitiva = await getDownloadURL(storageRef)
      }

      await setDoc(
        doc(db, 'usuarios', usuario.uid),
        {
          ...dadosPerfil,
          fotoUrl: urlDefinitiva,
          modificadoEm: serverTimestamp()
        },
        { merge: true }
      )

      setEditando(false)
      setBlobFinal(null)

      alert('Perfil atualizado ✨')
    } catch (err) {
      console.error(err)
      alert('Erro ao salvar.')
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) {
    return <div style={fullCenterStyle}>Sincronizando...</div>
  }

  return (
    <div style={containerStyle}>
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* AVATAR */}
      <div style={bannerStyle}>
        <div
          onClick={() => setAbrirOpcoes(true)}
          style={avatarWrapperStyle}
        >
          {dadosPerfil.fotoUrl ? (
            <img src={dadosPerfil.fotoUrl} alt="User" style={imgFitStyle} />
          ) : (
            <span>👤</span>
          )}
        </div>
      </div>

      {/* MODAL OPÇÕES */}
      {abrirOpcoes && (
        <div style={overlayStyle} onClick={() => setAbrirOpcoes(false)}>
          <div style={modalBoxStyle} onClick={e => e.stopPropagation()}>
            <button onClick={() => fileInputRef.current.click()}>
              Subir Foto
            </button>
            <button onClick={() => setAbrirOpcoes(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* CONTEÚDO */}
      <div style={contentBodyStyle}>
        {editando ? (
          <>
            <input
              value={dadosPerfil.nome}
              onChange={e =>
                setDadosPerfil({ ...dadosPerfil, nome: e.target.value })
              }
            />
            <textarea
              value={dadosPerfil.bio}
              onChange={e =>
                setDadosPerfil({ ...dadosPerfil, bio: e.target.value })
              }
            />
            <button onClick={handleSave} disabled={salvando}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>
          </>
        ) : (
          <>
            <h1>{dadosPerfil.nome}</h1>
            <p>{dadosPerfil.bio}</p>
            <button onClick={() => setEditando(true)}>Editar</button>
          </>
        )}
      </div>
    </div>
  )
}

// 🎨 estilos (mantive simples)
const containerStyle = { minHeight: '100vh' }
const bannerStyle = { height: '150px', background: '#009c3b' }
const avatarWrapperStyle = {
  width: '100px',
  height: '100px',
  borderRadius: '50%',
  overflow: 'hidden',
  margin: 'auto',
  cursor: 'pointer'
}
const imgFitStyle = { width: '100%', height: '100%', objectFit: 'cover' }
const contentBodyStyle = { textAlign: 'center', padding: '20px' }
const overlayStyle = {
  position: 'fixed',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  background: 'rgba(0,0,0,0.7)'
}
const modalBoxStyle = {
  background: '#fff',
  padding: '20px',
  margin: '100px auto',
  width: '200px'
}
const fullCenterStyle = {
  height: '100vh',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center'
}

// 🖼️ crop imagem
async function processarImagem(src, crop) {
  try {
    const img = new Image()
    img.src = src

    await new Promise((res, rej) => {
      img.onload = res
      img.onerror = rej
    })

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

    return await new Promise((res) =>
      canvas.toBlob(res, 'image/jpeg', 0.9)
    )
  } catch (err) {
    console.error(err)
    return null
  }
}

export default Perfil