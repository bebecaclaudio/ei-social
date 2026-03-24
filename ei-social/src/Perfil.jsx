import React, { useState, useEffect, useCallback } from 'react';
import { db } from './firebase-config';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import Cropper from 'react-easy-crop';

/** * MOTOR DE PROCESSAMENTO DE IMAGEM (Indispensável)
 * Converte as coordenadas do recorte (pixels) em uma imagem real para o banco.
 */
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
  // --- ESTADOS DE CONTROLE DE INTERFACE ---
  const [carregando, setCarregando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [menuFoto, setMenuFoto] = useState(false);
  const [toast, setToast] = useState({ visivel: false, mensagem: '' });
  
  // --- ESTADOS DO RECORTE (CROP) ---
  const [imagemParaCortar, setImagemParaCortar] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  // --- ESTADOS DE DADOS (Iniciam vazios conforme solicitado) ---
  const [dadosPerfil, setDadosPerfil] = useState({ 
    nome: '', 
    bio: '', 
    local: '', 
    username: '' 
  });
  const [foto, setFoto] = useState('');
  const LIMITE_BIO = 160;

  // --- CICLO DE VIDA: CARREGAMENTO ---
  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return;
      try {
        const docRef = doc(db, 'usuarios', usuario.uid);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data();
          setDadosPerfil({
            nome: data.nome || usuario.displayName || 'Usuário',
            bio: data.bio || '', // Mantém vazio se não houver
            local: data.local || '', // Dinâmico
            username: data.username || ''
          });
          setFoto(data.foto || '');
        }
      } catch (error) {
        console.error("Erro ao carregar dados do Firebase:", error);
      } finally {
        setCarregando(false);
      }
    }
    carregarDados();
  }, [usuario]);

  // --- FUNÇÕES DE INTERAÇÃO ---
  const exibirToast = (msg) => {
    setToast({ visivel: true, mensagem: msg });
    setTimeout(() => setToast({ visivel: false, mensagem: '' }), 3500);
  };

  const handleUsernameChange = (val) => {
    // Sanitização do @username em tempo real
    const formatado = val.toLowerCase().replace(/\s/g, '').replace(/[^a-z0-9_.]/g, '');
    setDadosPerfil({ ...dadosPerfil, username: formatado });
  };

  // --- LÓGICA DE PERSISTÊNCIA (FIREBASE) ---
  async function finalizarCorte() {
    try {
      const blob = await getCroppedImg(imagemParaCortar, croppedAreaPixels);
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64 = reader.result;
        await setDoc(doc(db, 'usuarios', usuario.uid), { foto: base64 }, { merge: true });
        setFoto(base64);
        setImagemParaCortar(null);
        exibirToast("Sua foto foi atualizada! ✨");
      };
    } catch (e) {
      exibirToast("Erro ao processar a imagem.");
    }
  }

  async function salvarTudo() {
    if (dadosPerfil.bio.length > LIMITE_BIO) return;
    try {
      // Validação de Username Único (Opcional, mas profissional)
      if (dadosPerfil.username) {
        const q = query(collection(db, "usuarios"), where("username", "==", dadosPerfil.username));
        const snap = await getDocs(q);
        if (snap.docs.some(d => d.id !== usuario.uid)) {
          exibirToast("Este @username já está em uso.");
          return;
        }
      }
      await setDoc(doc(db, 'usuarios', usuario.uid), { ...dadosPerfil }, { merge: true });
      setEditando(false);
      exibirToast("Perfil salvo com sucesso!");
    } catch (e) {
      exibirToast("Erro ao salvar alterações.");
    }
  }

  if (carregando) return <div style={sLoading}>Sincronizando dados...</div>;

  return (
    <div style={sPagina}>
      
      {/* SISTEMA DE FEEDBACK (Toast) */}
      <div style={sToast(toast.visivel)}>{toast.mensagem}</div>

      {/* MODAL DE RECORTE (CROPPER) */}
      {imagemParaCortar && (
        <div style={sModal}>
          <div style={sCropBox}>
            <Cropper 
              image={imagemParaCortar} 
              crop={crop} 
              zoom={zoom} 
              aspect={1} 
              onCropChange={setCrop} 
              onZoomChange={setZoom} 
              onCropComplete={useCallback((_, p) => setCroppedAreaPixels(p), [])} 
            />
          </div>
          <div style={{ marginTop: '20px', width: '320px' }}>
            <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(e.target.value)} style={{ width: '100%' }} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button onClick={() => setImagemParaCortar(null)} style={sBtnCancel}>Cancelar</button>
              <button onClick={finalizarCorte} style={sBtnConfirm}>Confirmar</button>
            </div>
          </div>
        </div>
      )}

      {/* BANNER E AVATAR */}
      <div style={sBanner}>
        <div style={sAvatarWrapper}>
          <div style={sAvatarCircle}>
            {foto ? <img src={foto} alt="" style={sImg} /> : <span style={{ fontSize: '50px' }}>👤</span>}
            <div onClick={() => setMenuFoto(!menuFoto)} style={sCameraOverlay}>
              <span>📷</span>
            </div>
          </div>
          {menuFoto && (
            <div style={sDropdown}>
              <label style={sMenuItem}>
                Nova Foto
                <input type="file" accept="image/*" onChange={(e) => {
                  const reader = new FileReader();
                  reader.onload = () => { setImagemParaCortar(reader.result); setMenuFoto(false); };
                  reader.readAsDataURL(e.target.files[0]);
                }} style={{ display: 'none' }} />
              </label>
              <button onClick={() => setMenuFoto(false)} style={sMenuItem}>Fechar</button>
            </div>
          )}
        </div>
        <button onClick={() => setEditando(!editando)} style={sBtnEdit}>
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      {/* ÁREA DE CONTEÚDO */}
      <div style={sContent}>
        {editando ? (
          <div style={sForm}>
            {/* USERNAME COM @ EM CINZA CLARO (#aaa) NO FUNDO ESCURO (#333) */}
            <div style={{ position: 'relative', width: '100%' }}>
              <span style={sAtSymbol}>@</span>
              <input 
                value={dadosPerfil.username} 
                onChange={e => handleUsernameChange(e.target.value)} 
                style={{ ...sInputDark, paddingLeft: '40px' }} 
                placeholder="username" 
              />
            </div>

            <input 
              value={dadosPerfil.nome} 
              onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} 
              style={sInputDark} 
              placeholder="Seu Nome" 
            />

            <input 
              value={dadosPerfil.local} 
              onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} 
              style={sInputDark} 
              placeholder="Localização (ex: Botucatu, SP)" 
            />
            
            <div style={{ position: 'relative', width: '100%' }}>
              <textarea 
                value={dadosPerfil.bio} 
                onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} 
                style={{ ...sTextareaDark, borderColor: dadosPerfil.bio.length > LIMITE_BIO ? '#ff4444' : '#555' }} 
                placeholder="Escreva algo sobre você..." 
              />
              <span style={sCounter(dadosPerfil.bio.length > LIMITE_BIO)}>
                {dadosPerfil.bio.length}/{LIMITE_BIO}
              </span>
            </div>

            <button 
              onClick={salvarTudo} 
              disabled={dadosPerfil.bio.length > LIMITE_BIO} 
              style={{ ...sBtnSave, opacity: dadosPerfil.bio.length > LIMITE_BIO ? 0.5 : 1 }}
            >
              Salvar Perfil
            </button>
          </div>
        ) : (
          <div style={{ animation: 'fadeIn 0.5s ease' }}>
            <h2 style={sDisplayNome}>{dadosPerfil.nome}</h2>
            <p style={sDisplayUser}>@{dadosPerfil.username || 'usuario'}</p>
            {dadosPerfil.local && <p style={sDisplayLocal}>📍 {dadosPerfil.local}</p>}
            <p style={sDisplayBio}>{dadosPerfil.bio}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- ESTILOS REFINADOS ---
const sPagina = { minHeight: '100vh', background: '#f8f9fa', paddingBottom: '60px', fontFamily: 'sans-serif' };
const sLoading = { textAlign: 'center', padding: '100px', fontWeight: 'bold', color: '#002776' };

const sToast = (v) => ({
  position: 'fixed', bottom: '40px', left: '50%', transform: `translateX(-50%) translateY(${v ? '0' : '40px'})`,
  background: '#002776', color: 'white', padding: '14px 30px', borderRadius: '50px', fontWeight: 'bold',
  boxShadow: '0 8px 25px rgba(0,0,0,0.3)', zIndex: 10000, transition: '0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)', opacity: v ? 1 : 0
});

const sBanner = { height: '180px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' };
const sAvatarWrapper = { position: 'absolute', bottom: '-55px', left: '50%', transform: 'translateX(-50%)', zIndex: 10 };
const sAvatarCircle = { width: '125px', height: '125px', borderRadius: '50%', background: 'white', border: '4px solid white', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const sImg = { width: '100%', height: '100%', objectFit: 'cover' };
const sCameraOverlay = { position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', opacity: 0, transition: '0.3s' };
// Para fazer o hover da câmera funcionar, você pode adicionar uma classe CSS ou manter o estado como fiz no JS anterior.

const sDropdown = { position: 'absolute', top: '135px', left: '50%', transform: 'translateX(-50%)', background: 'white', padding: '10px', borderRadius: '15px', boxShadow: '0 8px 20px rgba(0,0,0,0.2)', minWidth: '150px' };
const sMenuItem = { display: 'block', padding: '12px', textAlign: 'center', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', borderRadius: '10px', background: '#f8f9fa', border: 'none', marginBottom: '5px' };

const sBtnEdit = { position: 'absolute', right: '20px', bottom: '20px', padding: '10px 20px', borderRadius: '25px', border: 'none', background: 'white', color: '#002776', fontWeight: 'bold', cursor: 'pointer', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };

const sContent = { textAlign: 'center', marginTop: '80px', padding: '0 20px' };
const sDisplayNome = { fontSize: '34px', margin: '0', fontWeight: 'bold', color: '#1a1a1a' };
const sDisplayUser = { color: '#002776', fontWeight: 'bold', fontSize: '19px', margin: '5px 0' };
const sDisplayLocal = { color: '#666', fontSize: '15px', marginBottom: '15px' };
const sDisplayBio = { maxWidth: '500px', margin: '0 auto', color: '#444', lineHeight: '1.6', whiteSpace: 'pre-wrap' };

const sForm = { display: 'flex', flexDirection: 'column', gap: '15px', maxWidth: '340px', margin: '0 auto' };
const sAtSymbol = { position: 'absolute', left: '15px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontWeight: 'bold', fontSize: '16px' };
const sInputDark = { width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#333', color: 'white', fontSize: '16px', boxSizing: 'border-box' };
const sTextareaDark = { width: '100%', padding: '14px', height: '110px', borderRadius: '12px', border: '1px solid #555', background: '#333', color: 'white', fontSize: '16px', resize: 'none', boxSizing: 'border-box' };
const sCounter = (e) => ({ position: 'absolute', bottom: '12px', right: '15px', fontSize: '11px', color: e ? '#ff4444' : '#888', fontWeight: 'bold' });

const sBtnSave = { background: '#009c3b', color: 'white', padding: '15px', border: 'none', borderRadius: '35px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' };

const sModal = { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.92)', zIndex: 1000, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' };
const sCropBox = { position: 'relative', width: '320px', height: '320px', borderRadius: '15px', overflow: 'hidden' };
const sBtnConfirm = { background: '#009c3b', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };
const sBtnCancel = { background: '#555', color: 'white', border: 'none', padding: '12px 25px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer' };

export default Perfil;