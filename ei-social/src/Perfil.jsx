import { useState, useEffect, useCallback } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Cropper from 'react-easy-crop'

// --- FUNÇÃO DE RECORTE ---
const getCroppedImg = async (imageSrc, crop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.setAttribute('crossOrigin', 'anonymous'); 
    img.src = imageSrc;
    img.onload = () => resolve(img);
    img.onerror = (error) => reject(error);
  });

  const canvas = document.createElement('canvas');
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext('2d');

  ctx.drawImage(
    image,
    crop.x, crop.y, crop.width, crop.height,
    0, 0, crop.width, crop.height
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

  const [imagemParaCortar, setImagemParaCortar] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  const [dadosPerfil, setDadosPerfil] = useState({ nome: '', bio: '', local: '', username: '' })
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
            local: data.local || '',
            username: data.username || ''
          })
          setFoto(data.foto || '')
        } else {
          setDadosPerfil({ nome: usuario.displayName || 'Usuário', bio: '', local: '', username: '' })
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

  const handleUsernameChange = (val) => {
    const formatado = val.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_.]/g, '');
    setDadosPerfil({...dadosPerfil, username: formatado});
  }

  async function confirmarCorte() {
    try {
      setSubindoFoto(true)
      const blob = await getCroppedImg(imagemParaCortar, croppedAreaPixels)
      const reader = new FileReader()
      reader.readAsDataURL(blob)
      reader.onloadend = async () => {
        const base64data = reader.result 
        await setDoc(doc(db, 'usuarios', usuario.uid), { foto: base64data }, { merge: true })
        setFoto(base64data)
        setImagemParaCortar(null)
      }
    } catch (e) { alert("Erro ao processar imagem.") }
    finally { setSubindoFoto(false) }
  }

  async function salvarTexto() {
    if (dadosPerfil.bio.length > LIMITE_BIO) return alert("Bio muito longa!")
    try {
      if (dadosPerfil.username) {
        const q = query(collection(db, "usuarios"), where("username", "==", dadosPerfil.username));
        const snap = await getDocs(q);
        const jaExiste = snap.docs.some(d => d.id !== usuario.uid);
        if (jaExiste) return alert("Este @username já existe!");
      }

      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil, foto }, { merge: true })
      setEditando(false)
      alert("Perfil atualizado!")
    } catch (e) { alert("Erro ao salvar dados.") }
  }

  if (carregando) return <div style={{ textAlign: 'center', padding: '50px' }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px', fontFamily: 'sans-serif' }}>
      
      {imagemParaCortar && (
        <div style={modalOverlay}>
          <div style={cropContainer}>
            <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={{ width: '100%', maxWidth: '400px', padding: '20px', textAlign: 'center' }}>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
              <button onClick={() => setImagemParaCortar(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarCorte} disabled={subindoFoto} style={btnConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ height: '180px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' }}>
        <div style={avatarWrapper}>
          <div style={avatarCircle} onMouseEnter={() => setHoverFoto(true)} onMouseLeave={() => setHoverFoto(false)}>
            {foto ? <img src={foto} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <span style={{ fontSize: '50px' }}>👤</span>}
            <div onClick={() => setMenuFoto(!menuFoto)} style={{ ...cameraOverlay, opacity: (hoverFoto || menuFoto) ? 1 : 0 }}>
              <span style={{ fontSize: '30px' }}>📷</span>
            </div>
          </div>
          {menuFoto && (
            <div style={menuDropdown}>
              <label style={menuItem}>Nova Foto<input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} /></label>
              <button onClick={() => setMenuFoto(false)} style={menuItem}>Fechar</button>
            </div>
          )}
        </div>
        <button onClick={() => setEditando(!editando)} style={btnEdit}>{editando ? 'Cancelar' : 'Editar Perfil'}</button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px' }}>
        {editando ? (
          <div style={formStyle}>
            <div style={inputWrapper}>
              <span style={atSymbol}>@</span>
              <input value={dadosPerfil.username} onChange={e => handleUsernameChange(e.target.value)} style={{ ...inputStyle, paddingLeft: '35px' }} placeholder="username" />
            </div>
            <input value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} style={inputStyle} placeholder="Nome" />
            <input value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} style={inputStyle} placeholder="Local" />
            <textarea value={dadosPerfil.bio} onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} style={textareaStyle} placeholder="Bio..." />
            <button onClick={salvarTexto} style={btnSave}>Salvar</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '32px', margin: '0', fontWeight: 'bold' }}>{dadosPerfil.nome}</h2>
            <p style={{ color: '#002776', fontWeight: 'bold', fontSize: '18px', margin: '5px 0' }}>@{dadosPerfil.username || 'usuario'}</p>
            <p style={{ color: '#666', fontSize: '14px' }}>📍 {dadosPerfil.local || 'Botucatu - SP'}</p>
            <p style={{ maxWidth: '450px', margin: '15px auto', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{dadosPerfil.bio}</p>
          </>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS CORRIGIDOS ---
const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const cropContainer = { position: 'relative', width: '300px', height: '300px', borderRadius: '10px', overflow: 'hidden' };
const avatarWrapper = { position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)' };
const avatarCircle = { width: '120px', height: '120px', borderRadius: '50%', background: 'white', border: '4px solid white', overflow: 'hidden', position: 'relative', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const cameraOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.2s' };
const menuDropdown = { position: 'absolute', top: '130px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px', borderRadius: '10px', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px' };
const menuItem = { padding: '8px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', background: '#f0f0f0', borderRadius: '5px', border: 'none' };
const btnEdit = { position: 'absolute', right: '20px', bottom: '20px', padding: '8px 16px', borderRadius: '20px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer' };

// FORMULÁRIO CENTRALIZADO
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'center', maxWidth: '300px', margin: '0 auto' };
const inputWrapper = { position: 'relative', width: '100%' };
const atSymbol = { position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888', fontWeight: 'bold' };
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', boxSizing: 'border-box' };
const textareaStyle = { width: '100%', padding: '12px', height: '80px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', resize: 'none', boxSizing: 'border-box' };
const btnSave = { background: '#002776', color: 'white', padding: '10px 30px', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };
const btnConfirm = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' };
const btnCancel = { background: '#555', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '5px', cursor: 'pointer' };

export default Perfil;