import { useState, useEffect, useCallback } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Cropper from 'react-easy-crop'

// --- PROCESSAMENTO DE IMAGEM (CROP) ---
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
  ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise((resolve) => {
    canvas.toBlob((blob) => { resolve(blob); }, 'image/jpeg');
  });
};

function Perfil({ usuario }) {
  // --- ESTADOS DE CONTROLE ---
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuFoto, setMenuFoto] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  const [hoverFoto, setHoverFoto] = useState(false)
  const [toast, setToast] = useState({ visivel: false, mensagem: '' });

  // --- ESTADOS DO CROPPER ---
  const [imagemParaCortar, setImagemParaCortar] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // --- ESTADOS DE DADOS (DINÂMICOS) ---
  const [dadosPerfil, setDadosPerfil] = useState({ nome: '', bio: '', local: '', username: '' })
  const [foto, setFoto] = useState('')
  const LIMITE_BIO = 160

  // --- CARREGAMENTO INICIAL ---
  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          const data = docSnap.data()
          setDadosPerfil({
            nome: data.nome || usuario.displayName || 'Novo Usuário',
            bio: data.bio || '',
            local: data.local || '', // Vazio por padrão
            username: data.username || ''
          })
          setFoto(data.foto || '')
        }
      } catch (error) { 
        console.error("Erro:", error) 
      } finally { setCarregando(false) }
    }
    carregarDados()
  }, [usuario])

  // --- FEEDBACK VISUAL ---
  const exibirToast = (msg) => {
    setToast({ visivel: true, mensagem: msg });
    setTimeout(() => setToast({ visivel: false, mensagem: '' }), 3500);
  };

  const onCropComplete = useCallback((_, pixels) => { setCroppedAreaPixels(pixels) }, [])

  const handleUsernameChange = (val) => {
    const formatado = val.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_.]/g, '');
    setDadosPerfil({...dadosPerfil, username: formatado});
  }

  // --- PERSISTÊNCIA NO FIRESTORE ---
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
        exibirToast("Foto atualizada com sucesso! ✨")
      }
    } catch (e) { exibirToast("Erro ao processar imagem") }
    finally { setSubindoFoto(false) }
  }

  async function salvarDados() {
    if (dadosPerfil.bio.length > LIMITE_BIO) return;
    try {
      if (dadosPerfil.username) {
        const q = query(collection(db, "usuarios"), where("username", "==", dadosPerfil.username));
        const snap = await getDocs(q);
        if (snap.docs.some(d => d.id !== usuario.uid)) {
          exibirToast("Este @username já está em uso!");
          return;
        }
      }
      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil, foto }, { merge: true })
      setEditando(false)
      exibirToast("Perfil salvo com sucesso! 🚀")
    } catch (e) { exibirToast("Erro ao salvar alterações") }
  }

  if (carregando) return <div style={loadingStyle}>Conectando à rede Pleiadians...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px', fontFamily: 'sans-serif' }}>
      
      {/* NOTIFICAÇÃO TOAST */}
      <div style={toastStyle(toast.visivel)}>
        {toast.mensagem}
      </div>

      {/* INTERFACE DE CROP */}
      {imagemParaCortar && (
        <div style={modalOverlay}>
          <div style={cropContainer}>
            <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={cropControls}>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '15px', marginTop: '20px' }}>
              <button onClick={() => setImagemParaCortar(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarCorte} style={btnConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER E AVATAR */}
      <div style={headerBanner}>
        <div style={avatarWrapper}>
          <div style={avatarCircle} onMouseEnter={() => setHoverFoto(true)} onMouseLeave={() => setHoverFoto(false)}>
            {foto ? <img src={foto} alt="" style={imgFill} /> : <span style={{ fontSize: '50px' }}>👤</span>}
            <div onClick={() => setMenuFoto(!menuFoto)} style={{ ...cameraOverlay, opacity: (hoverFoto || menuFoto) ? 1 : 0 }}>
              <span style={{ fontSize: '30px' }}>📷</span>
            </div>
          </div>
          
          {menuFoto && (
            <div style={menuDropdown}>
              <label style={menuItem}>
                Mudar Foto
                <input type="file" accept="image/*" onChange={(e) => {
                  const file = e.target.files[0];
                  const reader = new FileReader();
                  reader.onload = () => { setImagemParaCortar(reader.result); setMenuFoto(false); };
                  reader.readAsDataURL(file);
                }} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setMenuFoto(false)} style={menuItem}>Fechar</button>
            </div>
          )}
        </div>
        <button onClick={() => setEditando(!editando)} style={btnEdit}>
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={contentArea}>
        {editando ? (
          <div style={formContainer}>
            <div style={inputWrapper}>
              <span style={atSymbol}>@</span>
              <input value={dadosPerfil.username} onChange={e => handleUsernameChange(e.target.value)} style={{ ...inputDark, paddingLeft: '40px' }} placeholder="username" />
            </div>
            <input value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} style={inputDark} placeholder="Seu Nome" />
            <input value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} style={inputDark} placeholder="Cidade, Estado" />
            
            <div style={{ position: 'relative', width: '100%' }}>
              <textarea 
                value={dadosPerfil.bio} 
                onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} 
                style={{ ...textareaDark, borderColor: dadosPerfil.bio.length > LIMITE_BIO ? '#ff4444' : '#555' }} 
                placeholder="Fale sobre você..." 
              />
              <span style={charCounter(dadosPerfil.bio.length > LIMITE_BIO)}>
                {dadosPerfil.bio.length}/{LIMITE_BIO}
              </span>
            </div>

            <button onClick={salvarDados} disabled={dadosPerfil.bio.length > LIMITE_BIO} style={{ ...btnSave, opacity: dadosPerfil.bio.length > LIMITE_BIO ? 0.5 : 1 }}>
              Salvar Alterações
            </button>
          </div>
        ) : (
          <div>
            <h2 style={displayNome}>{dadosPerfil.nome}</h2>
            <p style={displayUsername}>@{dadosPerfil.username || 'usuario'}</p>
            {dadosPerfil.local && <p style={displayLocal}>📍 {dadosPerfil.local}</p>}
            <p style={displayBio}>{dadosPerfil.bio || 'Olá! Este é meu perfil na Pleiadians.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS (SOPHISTICATED UI) ---
const loadingStyle = { textAlign: 'center', padding: '100px', color: '#002776', fontWeight: 'bold' };
const toastStyle = (visivel) => ({
  position: 'fixed', bottom: '40px', left: '50%', transform: `translateX(-50%) translateY(${visivel ? '0' : '40px'})`,
  background: '#002776', color: 'white', padding: '14px 30px', borderRadius: '50px', fontWeight: 'bold',
  boxShadow: '0 8px 25px rgba(0,0,0,0.3)', zIndex: 10000, transition: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  opacity: visivel ? 1 : 0, pointerEvents: 'none'
});

const headerBanner = { height: '180px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' };
const avatarWrapper = { position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)' };
const avatarCircle = { width: '125px', height: '125px', borderRadius: '50%', background: 'white', border: '5px solid white', overflow: 'hidden', position: 'relative', boxShadow: '0 5px 15px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const imgFill = { width: '100%', height: '100%', objectFit: 'cover' };
const cameraOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s' };

const menuDropdown = { position: 'absolute', top: '135px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '5px', minWidth: '150px', zIndex: 50 };
const menuItem = { padding: '10px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', borderRadius: '10px', background: '#f8f9fa', border: 'none' };

const btnEdit = { position: 'absolute', right: '25px', bottom: '25px', padding: '12px 24px', borderRadius: '30px', border: 'none', background: 'white', color: '#002776', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.15)' };

const contentArea = { textAlign: 'center', marginTop: '80px', padding: '0 25px' };
const displayNome = { fontSize: '34px', margin: '0', fontWeight: 'bold', color: '#1a1a1a' };
const displayUsername = { color: '#002776', fontWeight: 'bold', fontSize: '19px', margin: '5px 0' };
const displayLocal = { color: '#666', fontSize: '15px', marginBottom: '15px' };
const displayBio = { maxWidth: '500px', margin: '0 auto', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' };

const formContainer = { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '340px', margin: '0 auto' };
const inputWrapper = { position: 'relative', width: '100%' };
const atSymbol = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontWeight: 'bold', fontSize: '16px' };

const inputDark = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#333', color: 'white', fontSize: '16px', boxSizing: 'border-box', outline: 'none' };
const textareaDark = { width: '100%', padding: '14px', height: '110px', borderRadius: '12px', border: '1px solid #555', background: '#333', color: 'white', fontSize: '16px', resize: 'none', boxSizing: 'border-box' };
const charCounter = (erro) => ({ position: 'absolute', bottom: '12px', right: '15px', fontSize: '11px', fontWeight: 'bold', color: erro ? '#ff4444' : '#888' });

const btnSave = { background: '#009c3b', color: 'white', padding: '15px 40px', border: 'none', borderRadius: '35px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px' };

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const cropContainer = { position: 'relative', width: '320px', height: '320px', borderRadius: '15px', overflow: 'hidden' };
const cropControls = { width: '100%', maxWidth: '320px', padding: '20px', textAlign: 'center' };
const btnConfirm = { background: '#009c3b', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { background: '#555', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

export default Perfil;