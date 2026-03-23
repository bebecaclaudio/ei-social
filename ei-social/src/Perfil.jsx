import { useState, useEffect, useRef, useCallback } from 'react' // Adicionado useRef e useCallback
import Cropper from 'react-easy-crop' // Import da biblioteca de recorte
import { db } from './firebase-config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const fileInputRef = useRef(null) // Referência para o seletor de arquivos
  const LIMITE_BIO = 160

  // --- ESTADOS PARA O RECORTE DE IMAGEM ---
  const [imagemOriginal, setImagemOriginal] = useState(null) // Imagem que o usuário subiu
  const [crop, setCrop] = useState({ x: 0, y: 0 }) // Posição do recorte
  const [zoom, setZoom] = useState(1) // Nível de zoom
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null) // Área pixelada final

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: '',
    fotoUrl: '' 
  })

  useEffect(() => {
    async function inicializarPerfil() {
      if (!usuario?.uid) return
      
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setDadosPerfil(docSnap.data())
        } else {
          const novoPerfil = {
            nome: usuario.displayName || 'Usuário da Ei',
            bio: 'Sou novo por aqui! 👋',
            local: '',
            fotoUrl: usuario.photoURL || '', 
            criadoEm: serverTimestamp()
          }
          await setDoc(docRef, novoPerfil)
          setDadosPerfil(novoPerfil)
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setCarregando(false)
      }
    }
    inicializarPerfil()
  }, [usuario])

  // --- FUNÇÕES DE INTERAÇÃO COM A FOTO E RECORTE ---
  
  // 1. Quando o usuário escolhe a foto
  const handleTrocarFoto = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const arquivo = e.target.files[0]
      const reader = new FileReader()
      reader.addEventListener('load', () => setImagemOriginal(reader.result)) // Carrega a imagem no Cropper
      reader.readAsDataURL(arquivo)
    }
  }

  // 2. Quando o usuário termina de mover/zoom a imagem no Cropper
  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels) // Guarda a área final para o recorte
  }, [])

  // 3. Quando o usuário clica em "RECORTAR E USAR"
  const finalizarRecorte = async () => {
    try {
      // Cria a imagem final já recortada (como um Blob/Arquivo)
      const croppedImage = await getCroppedImg(imagemOriginal, croppedAreaPixels)
      
      // Cria uma URL temporária para exibir na bolinha
      const urlTemp = URL.createObjectURL(croppedImage)
      setDadosPerfil({ ...dadosPerfil, fotoUrl: urlTemp })
      
      // Fecha o Cropper
      setImagemOriginal(null)
    } catch (e) {
      console.error(e)
    }
  }

  const apagarFoto = (e) => {
    e.stopPropagation()
    setDadosPerfil({ ...dadosPerfil, fotoUrl: '' })
  }

  async function salvar() {
    setSalvando(true)
    try {
      const docRef = doc(db, 'usuarios', usuario.uid)
      await setDoc(docRef, dadosPerfil, { merge: true })
      setEditando(false)
      alert("Perfil atualizado! ✨")
    } catch (e) {
      alert("Erro ao salvar. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', color: '#002776', fontWeight: 'bold' }}>
      Buscando seus dados...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      
      {/* CSS PARA O EFEITO DE HOVER NO AVATAR E MODAL DE RECORTE */}
      <style>{`
        .avatar-container:hover .overlay-upload { opacity: 1 !important; }
        .cropper-modal { transition: opacity 0.3s ease; }
      `}</style>

      {/* --- MODAL DE RECORTE (JANELA DE AJUSTE) --- */}
      {imagemOriginal && (
        <div className="cropper-modal" style={modalCropStyle}>
          <div style={cropContainerStyle}>
            <Cropper
              image={imagemOriginal}
              crop={crop}
              zoom={zoom}
              aspect={1 / 1} // Garante o formato quadrado para a bolinha
              cropShape="round" // Mostra o frame circular para ajudar o designer
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
            />
          </div>
          <div style={cropControlsStyle}>
            {/* Controle de Zoom */}
            <input
              type="range"
              value={zoom}
              min={1}
              max={3}
              step={0.1}
              aria-labelledby="Zoom"
              onChange={(e) => setZoom(e.target.value)}
              style={zoomInputStyle}
            />
            {/* Botões de Ação */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => setImagemOriginal(null)} style={btnCancelarCrop}>Cancelar</button>
              <button onClick={finalizarRecorte} style={btnConfirmarCrop}>Recortar e Usar</button>
            </div>
          </div>
        </div>
      )}
      {/* --- FIM DO MODAL DE RECORTE --- */}

      {/* HEADER / BANNER BRASILEIRO (Original) */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #002776 0%, #009c3b 100%)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
      }}>
        
        {/* INPUT DE ARQUIVO (INVISÍVEL) */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleTrocarFoto} 
        />

        {/* FOTO DE PERFIL (AVATAR) COM HOVER E CLICK */}
        <div 
          className="avatar-container"
          onClick={() => fileInputRef.current.click()}
          style={{ ...avatarContainer, cursor: 'pointer' }}
        >
          {dadosPerfil.fotoUrl ? (
            <img src={dadosPerfil.fotoUrl} alt="Foto" style={avatarImg} />
          ) : (
            <span style={{ fontSize: '50px' }}>👤</span>
          )}

          {/* OVERLAY QUE APARECE AO PASSAR O MOUSE */}
          <div className="overlay-upload" style={overlayStyle}>
            <span style={{ fontSize: '20px' }}>📷</span>
            <span style={{ fontSize: '9px', fontWeight: 'bold' }}>TROCAR / AJUSTAR</span>
            {dadosPerfil.fotoUrl && (
              <button onClick={apagarFoto} style={btnApagarPequeno}>🗑️</button>
            )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO DO PERFIL - EXATAMENTE COMO ESTAVA ANTES */}
      <div style={{ marginTop: '60px', padding: '0 20px', textAlign: 'center' }}>
        {/* ... (Mantenha o código de Nome, Local e Bio aqui) */}
        {editando ? (
          <div style={formStyle}>
            {/* ... (Mantenha os inputs de edição) */}
          </div>
        ) : (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            {/* ... (Mantenha os dados de visualização) */}
            
            <button onClick={() => setEditando(true)} style={btnEditar}>
              ✏️ EDITAR PERFIL
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// --- FUNÇÃO AUXILIARgetCroppedImg ---
// Esta função cria a imagem final a partir da área recortada
async function getCroppedImg(imageSrc, pixelCrop) {
  const image = new Image()
  image.src = imageSrc
  return new Promise((resolve, reject) => {
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = pixelCrop.width
      canvas.height = pixelCrop.height
      const ctx = canvas.getContext('2d')

      // Recorta e desenha a imagem no canvas
      ctx.drawImage(
        image,
        pixelCrop.x,
        pixelCrop.y,
        pixelCrop.width,
        pixelCrop.height,
        0,
        0,
        pixelCrop.width,
        pixelCrop.height
      )

      // Transforma o canvas em um arquivo (Blob)
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Canvas is empty'))
          return
        }
        blob.name = 'recortada.jpg'
        resolve(blob) // Retorna o arquivo final
      }, 'image/jpeg')
    }
    image.onerror = (e) => reject(e)
  })
}

// --- ESTILOS ORIGINAIS + NOVOS PARA O RECORTE ---
const modalCropStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  background: 'rgba(0,0,0,0.85)', zIndex: 1000,
  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
}

const cropContainerStyle = { position: 'relative', width: '90%', maxWidth: '400px', height: '400px' }

const cropControlsStyle = {
  marginTop: '20px', width: '90%', maxWidth: '400px', 
  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px'
}

const zoomInputStyle = { width: '100%', accentColor: '#ffdf00' }

const btnConfirmarCrop = {
  background: '#009c3b', color: 'white', border: 'none', 
  padding: '12px 25px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer'
}

const btnCancelarCrop = {
  background: '#444', color: 'white', border: 'none', 
  padding: '12px 25px', borderRadius: '12px', cursor: 'pointer'
}

const overlayStyle = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s'
}

const btnApagarPequeno = {
  background: 'red', border: 'none', borderRadius: '50%', width: '26px', height: '26px',
  cursor: 'pointer', marginTop: '5px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const avatarContainer = {
  position: 'absolute', bottom: '-50px', width: '110px', height: '110px',
  borderRadius: '50%', background: 'white', border: '4px solid white',
  boxShadow: '0 4px 15px rgba(0,0,0,0.15)', overflow: 'hidden',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const avatarImg = { width: '100%', height: '100%', objectFit: 'cover' }
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666', marginLeft: '5px' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }
const btnEditar = { background: '#ffdf00', color: '#002776', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }
const btnSalvar = { background: '#009c3b', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
const btnCancelar = { color: '#ff4444', cursor: 'pointer', fontSize: '13px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }

export default Perfil;