import { useState, useEffect, useRef, useCallback } from 'react'
import Cropper from 'react-easy-crop' 
import { db, storage } from './firebase-config'
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  
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
        const docSnap = await getDoc(doc(db, 'usuarios', usuario.uid))
        if (docSnap.exists()) {
          const data = docSnap.data()
          setDadosPerfil({
            nome: data.nome || usuario.displayName || 'Membro Pleiadians',
            bio: data.bio || '',
            local: data.local || '',
            fotoUrl: data.fotoUrl || usuario.photoURL || ''
          })
        } else {
          const inicial = { 
            nome: usuario.displayName || 'Novo Membro', 
            bio: 'Iniciando minha jornada na Pleiadians.', 
            local: 'Botucatu, SP', 
            fotoUrl: usuario.photoURL || '' 
          }
          await setDoc(doc(db, 'usuarios', usuario.uid), inicial)
          setDadosPerfil(inicial)
        }
      } catch (e) { console.error("Erro ao sincronizar:", e) }
      finally { setCarregando(false) }
    }
    carregar()
  }, [usuario])

  const selecionarArquivo = (e) => {
    if (e.target.files[0]) {
      const reader = new FileReader()
      reader.onload = () => { setImagemParaCortar(reader.result) }
      reader.readAsDataURL(e.target.files[0])
    }
  }

  const aoCortar = useCallback((_, pixels) => setCroppedAreaPixels(pixels), [])

  const confirmarRecorte = async () => {
    const blob = await gerarBlob(imagemParaCortar, croppedAreaPixels)
    setArquivoParaUpload(blob)
    setDadosPerfil(prev => ({ ...prev, fotoUrl: URL.createObjectURL(blob) }))
    setImagemParaCortar(null)
  }

  const salvarGeral = async () => {
    setSalvando(true)
    let urlFinal = dadosPerfil.fotoUrl
    try {
      if (arquivoParaUpload) {
        const sRef = ref(storage, `perfis/${usuario.uid}/avatar.jpg`)
        await uploadBytes(sRef, arquivoParaUpload)
        urlFinal = await getDownloadURL(sRef)
      }
      
      await updateDoc(doc(db, 'usuarios', usuario.uid), { 
        ...dadosPerfil, 
        fotoUrl: urlFinal, 
        modificadoEm: serverTimestamp() 
      })

      setEditando(false)
      setArquivoParaUpload(null)
      alert("Sincronizado com sucesso! ✨")
    } catch (e) { alert("Erro ao salvar dados.") }
    finally { setSalvando(false) }
  }

  if (carregando) return <div style={{textAlign: 'center', padding: '50px'}}>Conectando à rede...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#fff', color: '#1a1a1a' }}>
      <style>{`.avatar-wrapper:hover .camera-icon { opacity: 1; }`}</style>

      {/* MODAL DE RECORTE */}
      {imagemParaCortar && (
        <div style={overlay}>
          <div style={modalBox}>
            <div style={{ position: 'relative', height: '300px', background: '#000' }}>
              <Cropper image={imagemParaCortar} crop={crop} zoom={zoom} aspect={1} cropShape="round" onCropChange={setCrop} onCropComplete={aoCortar} onZoomChange={setZoom} />
            </div>
            <button style={btnSave} onClick={confirmarRecorte}>Confirmar Foto</button>
            <button style={btnSimple} onClick={() => setImagemParaCortar(null)}>Cancelar</button>
          </div>
        </div>
      )}

      {/* HEADER E AVATAR */}
      <div style={banner}>
        <input type="file" ref={fileInputRef} style={{display: 'none'}} accept="image/*" onChange={selecionarArquivo} />
        <div className="avatar-wrapper" onClick={() => fileInputRef.current.click()} style={avatarWrapper}>
          {dadosPerfil.fotoUrl ? <img src={dadosPerfil.fotoUrl} alt="User" style={imgFit} /> : <span style={{fontSize: '40px'}}>👤</span>}
          <div className="camera-icon" style={cameraOverlay}>📷</div>
        </div>
      </div>

      {/* INFORMAÇÕES DO USUÁRIO (A PARTE QUE SUMIU) */}
      <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px' }}>
        {editando ? (
          <div style={formStyle}>
            <label style={labelStyle}>NOME</label>
            <input style={input} value={dadosPerfil.nome} onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})} />
            <label style={labelStyle}>LOCALIZAÇÃO</label>
            <input style={input} value={dadosPerfil.local} onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})} />
            <label style={labelStyle}>BIO</label>
            <textarea style={{...input, height: '80px'}} value={dadosPerfil.bio} onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})} />
            <button style={btnSave} onClick={salvarGeral} disabled={salvando}>{salvando ? '...' : 'SALVAR'}</button>
            <button style={btnSimple} onClick={() => setEditando(false)}>Cancelar</button>
          </div>
        ) : (
          <div style={{maxWidth: '500px', margin: '0 auto'}}>
            <h1 style={{fontSize: '28px', margin: '0'}}>{dadosPerfil.nome}</h1>
            <p style={{color: '#009c3b', fontWeight: 'bold', margin: '5px 0'}}>📍 {dadosPerfil.local || 'Brasil'}</p>
            <p style={{color: '#555', lineHeight: '1.6'}}>{dadosPerfil.bio || "Sua biografia aparecerá aqui."}</p>
            <button style={btnEdit} onClick={() => setEditando(true)}>✏️ CONFIGURAR PERFIL</button>
          </div>
        )}
      </div>
    </div>
  )
}

// ESTILOS DE SUPORTE
const banner = { height: '180px', background: 'linear-gradient(90deg, #002776, #009c3b)', position: 'relative', display: 'flex', justifyContent: 'center' };
const avatarWrapper = { position: 'absolute', bottom: '-55px', width: '115px', height: '115px', borderRadius: '50%', background: '#fff', border: '4px solid #fff', overflow: 'hidden', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' };
const imgFit = { width: '100%', height: '100%', objectFit: 'cover' };
const cameraOverlay = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s' };
const overlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const modalBox = { background: '#fff', padding: '20px', borderRadius: '15px', width: '90%', maxWidth: '350px' };
const btnSave = { width: '100%', padding: '12px', background: '#009c3b', color: '#fff', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' };
const btnEdit = { padding: '10px 25px', background: '#ffdf00', color: '#002776', border: 'none', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px' };
const btnSimple = { background: 'none', border: 'none', color: '#999', marginTop: '10px', cursor: 'pointer', width: '100%' };
const formStyle = { maxWidth: '350px', margin: '0 auto', textAlign: 'left' };
const input = { width: '100%', padding: '10px', marginBottom: '10px', borderRadius: '8px', border: '1px solid #ddd', boxSizing: 'border-box' };
const labelStyle = { fontSize: '11px', fontWeight: 'bold', color: '#888', marginBottom: '4px', display: 'block' };

async function gerarBlob(src, crop) {
  const img = new Image(); img.src = src;
  await new Promise(r => img.onload = r);
  const canvas = document.createElement('canvas');
  canvas.width = crop.width; canvas.height = crop.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return new Promise(r => canvas.toBlob(b => r(b), 'image/jpeg'));
}

export default Perfil;