import { useState, useEffect, useCallback } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore'
import Cropper from 'react-easy-crop'

// --- LÓGICA DE PROCESSAMENTO DE IMAGEM ---
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
  // --- ESTADOS DE CONTROLE ---
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuFoto, setMenuFoto] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false)
  const [hoverFoto, setHoverFoto] = useState(false)
  const [toast, setToast] = useState({ visivel: false, mensagem: '', tipo: 'sucesso' });

  // --- ESTADOS DE IMAGEM/CROP ---
  const [imagemParaCortar, setImagemParaCortar] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)

  // --- ESTADOS DE DADOS ---
  const [dadosPerfil, setDadosPerfil] = useState({ nome: '', bio: '', local: '', username: '' })
  const [foto, setFoto] = useState('')
  const LIMITE_BIO = 160

  // --- BUSCA DE DADOS INICIAL ---
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
      } catch (error) { 
        exibirToast("Erro ao carregar dados", "erro") 
      } finally { setCarregando(false) }
    }
    carregarDados()
  }, [usuario])

  // --- FUNÇÕES AUXILIARES ---
  const exibirToast = (msg, tipo = 'sucesso') => {
    setToast({ visivel: true, mensagem: msg, tipo });
    setTimeout(() => setToast({ visivel: false, mensagem: '', tipo: 'sucesso' }), 3500);
  };

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

  // --- AÇÕES DE BANCO DE DADOS ---
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
        exibirToast("Foto de perfil atualizada! ✨")
      }
    } catch (e) { exibirToast("Erro ao processar imagem", "erro") }
    finally { setSubindoFoto(false) }
  }

  async function excluirFoto() {
    if (!window.confirm("Deseja realmente remover sua foto?")) return;
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid), { foto: '' }, { merge: true })
      setFoto('')
      setMenuFoto(false)
      exibirToast("Foto removida")
    } catch (e) { exibirToast("Erro ao excluir foto", "erro") }
  }

  async function salvarTexto() {
    if (dadosPerfil.bio.length > LIMITE_BIO) return exibirToast("Bio muito longa!", "erro")
    
    try {
      if (dadosPerfil.username) {
        const q = query(collection(db, "usuarios"), where("username", "==", dadosPerfil.username));
        const snap = await getDocs(q);
        const jaExiste = snap.docs.some(d => d.id !== usuario.uid);
        if (jaExiste) return exibirToast("Username já está em uso!", "erro");
      }

      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil, foto }, { merge: true })
      setEditando(false)
      exibirToast("Perfil salvo com sucesso! 🚀")
    } catch (e) { exibirToast("Erro ao salvar dados", "erro") }
  }

  if (carregando) return <div style={loadingStyle}>Carregando Pleiadians...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px', fontFamily: 'sans-serif' }}>
      
      {/* NOTIFICAÇÃO TOAST SOFISTICADA */}
      <div style={toastStyle(toast.visivel, toast.tipo)}>
        {toast.mensagem}
      </div>

      {/* INTERFACE DE CORTE DE IMAGEM */}
      {imagemParaCortar && (
        <div style={modalOverlay}>
          <div style={cropContainer}>
            <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} onCropChange={setCrop} onZoomChange={setZoom} onCropComplete={onCropComplete} />
          </div>
          <div style={cropControls}>
            <p style={{ color: 'white', fontSize: '14px', marginBottom: '10px' }}>Arraste para centralizar sua foto</p>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '15px', marginTop: '25px' }}>
              <button onClick={() => setImagemParaCortar(null)} style={btnCancel}>Cancelar</button>
              <button onClick={confirmarCorte} disabled={subindoFoto} style={btnConfirm}>
                {subindoFoto ? 'Salvando...' : 'Confirmar Foto'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER E BANNER */}
      <div style={headerBanner}>
        <div style={avatarWrapper}>
          <div style={avatarCircle} onMouseEnter={() => setHoverFoto(true)} onMouseLeave={() => setHoverFoto(false)}>
            {foto ? <img src={foto} alt="Perfil" style={avatarImg} /> : <span style={{ fontSize: '50px' }}>👤</span>}
            
            <div onClick={() => setMenuFoto(!menuFoto)} style={{ ...cameraOverlay, opacity: (hoverFoto || menuFoto) ? 1 : 0 }}>
              <span style={{ fontSize: '30px' }}>📷</span>
            </div>
          </div>

          {/* MENU DE OPÇÕES DA FOTO */}
          {menuFoto && (
            <div style={menuDropdown}>
              <label style={menuItem}>
                Mudar Foto
                <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
              </label>
              {foto && <button onClick={excluirFoto} style={{ ...menuItem, color: '#ff4444', border: 'none' }}>Remover Foto</button>}
              <button onClick={() => setMenuFoto(false)} style={{ ...menuItem, border: 'none', background: '#eee' }}>Fechar</button>
            </div>
          )}
        </div>
        
        <button onClick={() => setEditando(!editando)} style={btnEdit}>
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* CONTEÚDO DO PERFIL */}
      <div style={contentArea}>
        {editando ? (
          <div style={formContainer}>
            <div style={inputGroup}>
              <span style={atLabel}>@</span>
              <input value={dadosPerfil.username} onChange={e => handleUsernameChange(e.target.value)} style={inputUsername} placeholder="username" />
            </div>

            <input value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} style={inputField} placeholder="Seu Nome de Exibição" />
            <input value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} style={inputField} placeholder="Onde você mora?" />
            
            <div style={{ width: '100%', position: 'relative' }}>
              <textarea 
                value={dadosPerfil.bio} 
                onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} 
                style={{ ...textareaField, borderColor: dadosPerfil.bio.length > LIMITE_BIO ? '#ff4444' : '#ddd' }} 
                placeholder="Conte sua história polimata..." 
              />
              <span style={charCounter(dadosPerfil.bio.length > LIMITE_BIO)}>
                {dadosPerfil.bio.length} / {LIMITE_BIO}
              </span>
            </div>

            <button onClick={salvarTexto} style={btnSave}>Salvar Alterações</button>
          </div>
        ) : (
          <div style={infoContainer}>
            <h2 style={displayNome}>{dadosPerfil.nome}</h2>
            <p style={displayUsername}>@{dadosPerfil.username || 'usuario_pleiades'}</p>
            <p style={displayLocal}>📍 {dadosPerfil.local || 'Botucatu - SP'}</p>
            <p style={displayBio}>{dadosPerfil.bio || 'Bem-vindo ao meu fragmento de consciência.'}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// --- DICIONÁRIO DE ESTILOS (SOPHISTICATED DESIGN) ---
const loadingStyle = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', fontSize: '20px', color: '#002776', fontWeight: 'bold' };

const toastStyle = (visivel, tipo) => ({
  position: 'fixed', bottom: '40px', left: '50%', transform: `translateX(-50%) translateY(${visivel ? '0' : '40px'})`,
  background: tipo === 'sucesso' ? '#002776' : '#cc0000', color: 'white', padding: '14px 30px', borderRadius: '50px',
  fontWeight: 'bold', boxShadow: '0 8px 25px rgba(0,0,0,0.3)', zIndex: 10000, transition: '0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  opacity: visivel ? 1 : 0, pointerEvents: 'none', textAlign: 'center', minWidth: '250px'
});

const headerBanner = { height: '200px', background: 'linear-gradient(135deg, #002776 0%, #009c3b 50%, #ffdf00 100%)', position: 'relative' };
const avatarWrapper = { position: 'absolute', bottom: '-60px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 };
const avatarCircle = { width: '130px', height: '130px', borderRadius: '50%', background: 'white', border: '5px solid white', overflow: 'hidden', position: 'relative', boxShadow: '0 6px 20px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const avatarImg = { width: '100%', height: '100%', objectFit: 'cover' };
const cameraOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: '0.3s' };

const menuDropdown = { position: 'absolute', top: '140px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '12px', borderRadius: '18px', boxShadow: '0 10px 40px rgba(0,0,0,0.2)', display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '180px' };
const menuItem = { padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px', background: '#f8f9fa', borderRadius: '10px', transition: '0.2s', border: 'none' };

const btnEdit = { position: 'absolute', right: '25px', bottom: '25px', padding: '12px 24px', borderRadius: '30px', border: 'none', background: '#002776', color: 'white', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' };

const contentArea = { textAlign: 'center', marginTop: '90px', padding: '0 25px' };
const infoContainer = { animation: 'fadeIn 0.5s ease' };
const displayNome = { fontSize: '36px', margin: '0', fontWeight: '900', color: '#1a1a1a', letterSpacing: '-0.5px' };
const displayUsername = { color: '#002776', fontWeight: 'bold', fontSize: '20px', margin: '8px 0' };
const displayLocal = { color: '#666', fontSize: '15px', marginBottom: '20px' };
const displayBio = { maxWidth: '500px', margin: '0 auto', color: '#444', lineHeight: '1.7', fontSize: '16px', whiteSpace: 'pre-wrap' };

const formContainer = { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '350px', margin: '0 auto' };
const inputGroup = { position: 'relative', width: '100%' };
const atLabel = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', fontWeight: 'bold', color: '#002776' };
const inputUsername = { width: '100%', padding: '14px 14px 14px 40px', borderRadius: '12px', border: '2px solid #eee', fontSize: '16px', boxSizing: 'border-box', outline: 'none' };
const inputField = { width: '100%', padding: '14px', borderRadius: '12px', border: '2px solid #eee', fontSize: '16px', boxSizing: 'border-box' };
const textareaField = { width: '100%', padding: '14px', height: '120px', borderRadius: '12px', border: '2px solid #eee', fontSize: '16px', resize: 'none', boxSizing: 'border-box', transition: '0.3s' };
const charCounter = (erro) => ({ position: 'absolute', bottom: '12px', right: '15px', fontSize: '11px', fontWeight: 'bold', color: erro ? '#ff4444' : '#aaa' });

const btnSave = { background: '#009c3b', color: 'white', padding: '15px 40px', border: 'none', borderRadius: '35px', fontWeight: 'bold', fontSize: '16px', cursor: 'pointer', marginTop: '10px', boxShadow: '0 6px 15px rgba(0,156,59,0.2)' };

const modalOverlay = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 5000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const cropContainer = { position: 'relative', width: '350px', height: '350px', borderRadius: '20px', overflow: 'hidden', border: '2px solid #444' };
const cropControls = { width: '100%', maxWidth: '350px', padding: '30px 20px', textAlign: 'center' };
const btnConfirm = { background: '#009c3b', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };
const btnCancel = { background: '#444', color: 'white', border: 'none', padding: '14px 28px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' };

export default Perfil;