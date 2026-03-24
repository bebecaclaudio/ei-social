import { useState, useEffect, useCallback } from 'react'
import { db, storage } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Cropper from 'react-easy-crop' // Certifique-se de ter instalado: npm install react-easy-crop

// Função auxiliar para processar o recorte da imagem
const getCroppedImg = async (imageSrc, crop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });
  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg');
  });
};

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuFoto, setMenuFoto] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  
  // Estados para o Crop (Corte)
  const [imagemParaCortar, setImagemParaCortar] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [dadosPerfil, setDadosPerfil] = useState({ nome: '', bio: '', local: '' })
  const [foto, setFoto] = useState('')
  const LIMITE_BIO = 160

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)
        
        if (docSnap.exists()) {
          const data = docSnap.data()
          setDadosPerfil({
            nome: data.nome || usuario.displayName || 'Usuário',
            bio: data.bio || '',
            local: data.local || ''
          })
          // Prioriza a foto do seu Storage, se não houver, usa a do Google (temporária)
          setFoto(data.foto || usuario.photoURL || '')
        } else {
          setDadosPerfil({ nome: usuario.displayName || 'Usuário', bio: '', local: '' })
          setFoto(usuario.photoURL || '')
        }
      } catch (error) { console.error("Erro:", error) }
      finally { setCarregando(false) }
    }
    carregarDados()
  }, [usuario])

  const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels) }, [])

  // Inicia o processo de escolha de foto
  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setImagemParaCortar(reader.result); setMenuFoto(false); }
    reader.readAsDataURL(file)
  }

  // Confirma o corte e faz o upload real
  async function confirmarCorte() {
    try {
      setSubindoFoto(true)
      const blob = await getCroppedImg(imagemParaCortar, croppedAreaPixels)
      const storageRef = ref(storage, `usuarios/${usuario.uid}/perfil.jpg`)
      await uploadBytes(storageRef, blob)
      const url = await getDownloadURL(storageRef)
      
      setFoto(url)
      await setDoc(doc(db, 'usuarios', usuario.uid), { foto: url }, { merge: true })
      setImagemParaCortar(null)
      alert("Foto de perfil atualizada!")
    } catch (e) { alert("Erro ao salvar imagem.") }
    finally { setSubindoFoto(false) }
  }

  async function salvarTexto() {
    if (dadosPerfil.bio.length > LIMITE_BIO) return alert("Bio muito longa!")
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil, foto }, { merge: true })
      setEditando(false)
      alert("Perfil salvo!")
    } catch (e) { alert("Erro ao salvar dados.") }
  }

  if (carregando) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px', fontFamily: 'sans-serif' }}>
      
      {/* MODAL DE CORTE */}
      {imagemParaCortar && (
        <div style={modalOverlay}>
          <div style={cropContainer}>
            <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={{ width: '100%', maxWidth: '400px', padding: '20px' }}>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
              <button onClick={() => setImagemParaCortar(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarCorte} style={btnConfirm}>{subindoFoto ? 'Salvando...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER E AVATAR */}
      <div style={{ height: '180px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' }}>
        <div style={avatarWrapper}>
          <div style={avatarCircle}>
            {foto ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
            <div onClick={() => setMenuFoto(!menuFoto)} style={cameraOverlay}>📷</div>
          </div>

          {menuFoto && (
            <div style={menuDropdown}>
              <label style={menuItem}>
                Nova Foto
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {foto && (
                <button onClick={async () => {
                  setFoto(''); 
                  await setDoc(doc(db, 'usuarios', usuario.uid), { foto: '' }, { merge: true });
                  setMenuFoto(false);
                }} style={{ ...menuItem, color: 'red', border: 'none', background: 'none' }}>Remover Foto</button>
              )}
            </div>
          )}
        </div>
        <button onClick={() => setEditando(!editando)} style={btnEdit}>
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* INFO DO PERFIL */}
      <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px' }}>
        {editando ? (
          <div style={formStyle}>
            <input value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} style={inputStyle} placeholder="Nome" />
            <input value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} style={inputStyle} placeholder="Cidade/Estado" />
            <textarea value={dadosPerfil.bio} onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} style={textareaStyle} placeholder="Bio..." />
            <button onClick={salvarTexto} style={btnSave}>Salvar Tudo</button>
          </div>
        ) : (
          <>
            <h2>{dadosPerfil.nome}</h2>
            <p style={{ color: '#666' }}>📍 {dadosPerfil.local || 'Local não definido'}</p>
            <p style={{ maxWidth: '400px', margin: '10px auto', whiteSpace: 'pre-wrap' }}>{dadosPerfil.bio || 'Sem bio.'}</p>
          </>
        )}
      </div>
    </div>
  )
}

// Estilos rápidos para manter o Perfil organizado
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const cropContainer = { position: 'relative', width: '350px', height: '350px', background: '#333', borderRadius: '8px', overflow: 'hidden' };
const avatarWrapper = { position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', zIndex: 5 };
const avatarCircle = { width: '120px', height: '120px', borderRadius: '50%', background: 'white', border: '4px solid white', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '50px' };
const cameraOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, cursor: 'pointer', transition: '0.2s' };
// Adicione hover no CSS para cameraOverlay opacity: 1
const menuDropdown = { position: 'absolute', top: '130px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px', borderRadius: '12px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', minWidth: '150px' };
const menuItem = { padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px' };
const btnEdit = { position: 'absolute', right: '20px', bottom: '20px', padding: '8px 16px', borderRadius: '20px', border: 'none', cursor: 'pointer', fontWeight: 'bold' };
const btnConfirm = { flex: 1, background: '#009c3b', color: 'white', border: 'none', padding: '10px', borderRadius: '8px', fontWeight: 'bold' };
const btnCancel = { flex: 1, background: '#444', color: 'white', border: 'none', padding: '10px', borderRadius: '8px' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center' };
const inputStyle = { padding: '10px', width: '300px', borderRadius: '8px', border: '1px solid #ccc' };
const textareaStyle = { padding: '10px', width: '300px', height: '80px', borderRadius: '8px', border: '1px solid #ccc' };
const btnSave = { background: '#002776', color: 'white', padding: '12px 30px', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer' };

export default Perfil;