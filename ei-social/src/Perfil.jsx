import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop' 
import { db, storage } from './firebase-config'
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [abrirOpcoes, setAbrirOpcoes] = useState(false)
  
  const [imagemParaCortar, setImagemParaCortar] = useState(null)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null)
  const [arquivoParaUpload, setArquivoParaUpload] = useState(null)

  const fileInputRef = useRef(null)
  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '', bio: '', local: '', fotoUrl: '' 
  })

  useEffect(() => {
    async function carregar() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) {
          setDadosPerfil(docSnap.data())
        } else {
          const inicial = { 
            nome: usuario.displayName || 'Membro', 
            bio: '', 
            local: '', 
            fotoUrl: usuario.photoURL || '',
            criadoEm: serverTimestamp()
          }
          await setDoc(docRef, inicial)
          setDadosPerfil(inicial)
        }
      } catch (e) { console.error("Erro Firebase:", e) }
      finally { setCarregando(false) }
    }
    carregar()
  }, [usuario])

  const selecionarArquivo = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => { setImagemParaCortar(reader.result); setAbrirOpcoes(false); }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const aoCortar = useCallback((_, pixels) => setCroppedAreaPixels(pixels), [])

  const confirmarRecorte = async () => {
    try {
      const blob = await gerarBlob(imagemParaCortar, croppedAreaPixels)
      setArquivoParaUpload(blob)
      setDadosPerfil(prev => ({ ...prev, fotoUrl: URL.createObjectURL(blob) }))
      setImagemParaCortar(null)
    } catch (e) { console.error("Erro recorte:", e) }
  }

  const salvarGeral = async () => {
    setSalvando(true)
    let urlFinal = dadosPerfil.fotoUrl
    try {
      if (arquivoParaUpload) {
        const sRef = ref(storage, `perfis/${usuario.uid}/${Date.now()}.jpg`)
        await uploadBytes(sRef, arquivoParaUpload)
        urlFinal = await getDownloadURL(sRef)
      }
      
      const docRef = doc(db, 'usuarios', usuario.uid)
      
      // LINHA 72 - CORRIGIDA E REVISADA:
      await updateDoc(docRef, { 
        nome: dadosPerfil.nome,
        bio: dadosPerfil.bio,
        local: dadosPerfil.local,
        fotoUrl: urlFinal, 
        atualizadoEm: serverTimestamp() 
      })

      setEditando(false)
      setArquivoParaUpload(null)
      alert("Perfil atualizado!")
    } catch (e) { alert("Erro ao salvar") }
    finally { setSalvando(false) }
  }

  if (carregando) return <div style={center}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      <style>{`.avatar-container:hover .camera-icon { opacity: 1; }`}</style>

      {/* MODAL OPÇÕES */}
      {abrirOpcoes && (
        <div style={overlay} onClick={() => setAbrirOpcoes(false)}>
          <div style={modalBox} onClick={e => e.stopPropagation()}>
            <button style={btnMenu} onClick={() => fileInputRef.current.click()}>📸 Nova Foto</button>
            <button style={btnSimple} onClick={() => setAbrirOpcoes(false)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* MODAL RECORTE */}
      {imagemParaCortar && (
        <div style={overlay}>
          <div style={{...modalBox, maxWidth: '400px'}}>
            <div style={{ position: 'relative', height: '300px', background: '#000' }}>
              <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={aoCortar} onZoomChange={setZoom} />
            </div>
            <div style={{padding: '15px'}}>
              <input type="range" min={1} max={3} step={0.1} value={zoom} onChange={e => setZoom(e.target.value)} style={{width: '100%'}}/>
              <button style={btnSave} onClick={confirmarRecorte}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div style={banner}>
        <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={selecionarArquivo} />
        <div className="avatar-container" onClick={() => setAbrirOpcoes(true)} style={avatarWrapper}>
          {dadosPerfil.fotoUrl ? <img src={dadosPerfil.fotoUrl} alt="Avatar" style={img} /> : <span>👤</span>}
          <div className="camera-icon" style={cameraOverlay}>📷</div>
        </div>
      </div>

      {/* INFO */}
      <div style={{ textAlign: 'center', marginTop: '60px' }}>
        {editando ? (
          <div style={{maxWidth: '350px', margin: '0 auto'}}>
            <input style={input} value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} placeholder="Nome" />
            <input style={input} value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} placeholder="Local" />
            <textarea style={{...input, height: '80px'}} value={dadosPerfil.bio} onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} placeholder="Bio" />
            <button style={btnSave} onClick={salvarGeral} disabled={salvando}>{salvando ? '...' : 'SALVAR'}</button>
            <button style={btnSimple} onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        ) : (
          <div>
            <h2>{dadosPerfil.nome}</h2>
            <p style={{color: '#009c3b'}}>📍 {dadosPerfil.local || 'Terra'}</p>
            <p style={{maxWidth: '400px', margin: '10px auto'}}>{dadosPerfil.bio}</p>
            <button style={btnEdit} onClick={() => setEditando(true)}>✏️ EDITAR PERFIL</button>
          </div>
        )}
      </div>
    </div>
  )
}

async function gerarBlob(src, crop) {
  const img = new Image(); img.src = src;
  await new Promise(r => img.onload = r);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width; canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise(r => canvas.toBlob(b => r(b), 'image/jpeg'));
}

const banner = { height: '180px', background: 'linear-gradient(90deg, #002776, #009c3b)', position: 'relative', display: 'flex', justifyContent: 'center' };
const avatarWrapper = { position: 'absolute', bottom: '-50px', width: '110px', height: '110px', borderRadius: '50%', background: '#fff', border: '4px solid #fff', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' };
const img = { width: '100%', height: '100%', objectFit: 'cover' };
const cameraOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalBox = { background: '#fff', padding: '20px', borderRadius: '15px', width: '300px', textAlign: 'center' };
const btnMenu = { width: '100%', padding: '12px', margin: '5px 0', borderRadius: '8px', cursor: 'pointer' };
const btnSave = { width: '100%', padding: '12px', background: '#009c3b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const btnEdit = { padding: '10px 20px', background: '#ffdf00', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer' };
const btnSimple = { background: 'none', border: 'none', color: '#999', marginTop: '10px', cursor: 'pointer' };
const input = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd' };
const center = { display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' };

export default Perfil;