import { useState, useEffect, useCallback } from 'react'
import { db, storage } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import Cropper from 'react-easy-crop'

// Função auxiliar para processar o recorte da imagem (Gera o arquivo final)
const getCroppedImg = async (imageSrc, crop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.src = imageSrc;
    img.setAttribute('crossOrigin', 'anonymous'); 
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob);
    }, 'image/jpeg');
  });
};

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuFoto, setMenuFoto] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  const [hoverFoto, setHoverFoto] = useState(false)

  // Estados para o Corte (Crop)
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
          setFoto(data.foto || usuario.photoURL || '')
        } else {
          setDadosPerfil({ nome: usuario.displayName || 'Usuário', bio: '', local: '' })
          setFoto(usuario.photoURL || '')
        }
      } catch (error) { console.error("Erro ao carregar perfil:", error) }
      finally { setCarregando(false) }
    }
    carregarDados()
  }, [usuario])

  const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels) }, [])

  const handleFileChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setImagemParaCortar(reader.result); setMenuFoto(false); }
    reader.readAsDataURL(file)
  }

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
    } catch (e) { alert("Erro ao salvar imagem.") }
    finally { setSubindoFoto(false) }
  }

  async function salvarTexto() {
    if (dadosPerfil.bio.length > LIMITE_BIO) return alert("Bio muito longa!")
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil, foto }, { merge: true })
      setEditando(false)
      alert("Perfil atualizado!")
    } catch (e) { alert("Erro ao salvar dados.") }
  }

  if (carregando) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px', fontFamily: 'sans-serif' }}>
      
      {/* MODAL DE CORTE (ZOOM E CROP) */}
      {imagemParaCortar && (
        <div style={modalOverlay}>
          <div style={cropContainer}>
            <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={{ width: '100%', maxWidth: '400px', padding: '20px', textAlign: 'center' }}>
            <label style={{ color: 'white', display: 'block', marginBottom: '10px' }}>Ajuste o Zoom</label>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setImagemParaCortar(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarCorte} style={btnConfirm}>{subindoFoto ? 'Processando...' : 'Confirmar Foto'}</button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER COLORIDO */}
      <div style={{ height: '180px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' }}>
        
        {/* AVATAR COM A CAMERAZINHA FOFA */}
        <div style={avatarWrapper}>
          <div 
            style={avatarCircle}
            onMouseEnter={() => setHoverFoto(true)}
            onMouseLeave={() => setHoverFoto(false)}
          >
            {subindoFoto ? (
               <span style={{ fontSize: '14px', color: '#666' }}>Lendo...</span>
            ) : foto ? (
              <img src={foto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <span style={{ fontSize: '50px' }}>👤</span>
            )}

            {/* OVERLAY DA CÂMERA */}
            <div
              onClick={() => setMenuFoto(!menuFoto)}
              style={{
                ...cameraOverlay,
                opacity: (hoverFoto || menuFoto) ? 1 : 0
              }}
            >
              <span style={{ fontSize: '30px' }}>📷</span>
            </div>
          </div>

          {/* MENU DROPDOWN DA FOTO */}
          {menuFoto && (
            <div style={menuDropdown}>
              <label style={menuItem}>
                Nova Foto
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {foto && (
                <button 
                  onClick={async () => {
                    setFoto(''); 
                    await setDoc(doc(db, 'usuarios', usuario.uid), { foto: '' }, { merge: true });
                    setMenuFoto(false);
                  }} 
                  style={{ ...menuItem, color: '#ff4444', border: 'none', background: 'none', width: '100%' }}
                >
                  Excluir Foto
                </button>
              )}
              <button onClick={() => setMenuFoto(false)} style={{ ...menuItem, color: '#888', border: 'none', background: 'none' }}>Fechar</button>
            </div>
          )}
        </div>

        <button onClick={() => setEditando(!editando)} style={btnEdit}>
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* CONTEÚDO DO PERFIL */}
      <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px' }}>
        {editando ? (
          <div style={formStyle}>
            <input value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} style={inputStyle} placeholder="Nome" />
            <input value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} style={inputStyle} placeholder="Cidade, Estado" />
            <textarea value={dadosPerfil.bio} onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} style={textareaStyle} placeholder="Escreva algo sobre você..." />
            <button onClick={salvarTexto} style={btnSave}>Salvar Alterações</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '26px', margin: '0 0 5px' }}>{dadosPerfil.nome}</h2>
            <p style={{ color: '#666', fontSize: '14px', margin: '0 0 15px' }}>📍 {dadosPerfil.local || 'Explorando o mundo'}</p>
            <p style={{ maxWidth: '450px', margin: '0 auto', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {dadosPerfil.bio || 'Bem-vindo ao meu perfil!'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ESTILOS (CSS-in-JS)
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const cropContainer = { position: 'relative', width: '320px', height: '320px', background: '#333', borderRadius: '12px', overflow: 'hidden' };
const avatarWrapper = { position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 };
const avatarCircle = { width: '120px', height: '120px', borderRadius: '50%', background: 'white', border: '4px solid white', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 15px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cameraOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s' };
const menuDropdown = { position: 'absolute', top: '130px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '160px' };
const menuItem = { padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', borderRadius: '8px', background: '#f8f9fa' };
const btnEdit = { position: 'absolute', right: '20px', bottom: '20px', padding: '10px 20px', borderRadius: '25px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' };
const btnConfirm = { flex: 1, background: '#009c3b', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { flex: 1, background: '#555', color: 'white', border: 'none', padding: '12px', borderRadius: '10px', cursor: 'pointer' };
const formStyle = { display: 'flex', flexDirection: 'column', gap: '12px', alignItems: 'center' };
const inputStyle = { padding: '12px', width: '300px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px' };
const textareaStyle = { padding: '12px', width: '300px', height: '100px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', resize: 'none' };
const btnSave = { background: '#002776', color: 'white', padding: '12px 40px', border: 'none', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default Perfil;