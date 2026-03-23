import { useState, useEffect } from 'react'
import { db, storage } from './firebase-config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage'
import Cropper from 'react-easy-crop'

function Perfil({ usuario }) {

  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)

  const [mostrarMenu, setMostrarMenu] = useState(false)
  const [imagemTemp, setImagemTemp] = useState(null)

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [areaCrop, setAreaCrop] = useState(null)

  const LIMITE_BIO = 160

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: '',
    fotoUrl: ''
  })

  // ------------------ CARREGAR PERFIL ------------------
  useEffect(() => {
    async function inicializarPerfil() {
      if (!usuario?.uid) return

      try {
        const refDoc = doc(db, 'usuarios', usuario.uid)
        const snap = await getDoc(refDoc)

        if (snap.exists()) {
          setDadosPerfil(snap.data())
        } else {
          const novo = {
            nome: usuario.displayName || 'Usuário',
            bio: 'Sou novo por aqui 👋',
            local: '',
            fotoUrl: usuario.photoURL || '',
            criadoEm: serverTimestamp()
          }

          await setDoc(refDoc, novo)
          setDadosPerfil(novo)
        }

      } catch (e) {
        console.error(e)
      } finally {
        setCarregando(false)
      }
    }

    inicializarPerfil()
  }, [usuario])

  // ------------------ EDITAR PERFIL ------------------
  async function salvarPerfil() {
    setSalvando(true)

    try {
      const refDoc = doc(db, 'usuarios', usuario.uid)
      await setDoc(refDoc, dadosPerfil, { merge: true })
      setEditando(false)
    } catch {
      alert("Erro ao salvar")
    } finally {
      setSalvando(false)
    }
  }

  // ------------------ IMAGEM ------------------
  function handleSelecionarImagem(e) {
    const file = e.target.files[0]
    if (!file) return

    const url = URL.createObjectURL(file)
    setImagemTemp(url)
  }

  async function salvarImagem() {
    try {
      const response = await fetch(imagemTemp)
      const blob = await response.blob()

      const storageRef = ref(storage, `avatars/${usuario.uid}`)

      await uploadBytes(storageRef, blob)

      const url = await getDownloadURL(storageRef)

      const novosDados = { ...dadosPerfil, fotoUrl: url }
      setDadosPerfil(novosDados)

      await setDoc(doc(db, 'usuarios', usuario.uid), novosDados, { merge: true })

      setImagemTemp(null)

    } catch (e) {
      console.error(e)
    }
  }

  async function removerFoto() {
    try {
      const storageRef = ref(storage, `avatars/${usuario.uid}`)
      await deleteObject(storageRef)

      const novosDados = { ...dadosPerfil, fotoUrl: '' }
      setDadosPerfil(novosDados)

      await setDoc(doc(db, 'usuarios', usuario.uid), novosDados, { merge: true })
    } catch (e) {
      console.error(e)
    }
  }

  if (carregando) return <div className="loading">Carregando...</div>

  return (
    <div className="perfil">

      {/* INPUT ESCONDIDO */}
      <input
        type="file"
        accept="image/*"
        id="uploadFoto"
        style={{ display: 'none' }}
        onChange={handleSelecionarImagem}
      />

      {/* BANNER */}
      <div className="banner">

        {/* AVATAR */}
        <div
          className="avatar"
          onMouseEnter={() => setMostrarMenu(true)}
          onMouseLeave={() => setMostrarMenu(false)}
          onClick={() => setMostrarMenu(!mostrarMenu)}
        >
          {dadosPerfil.fotoUrl ? (
            <img src={dadosPerfil.fotoUrl} />
          ) : '👤'}

          {mostrarMenu && (
            <div className="menu-avatar">

              <button onClick={() =>
                document.getElementById('uploadFoto').click()
              }>
                📤 Enviar foto
              </button>

              {dadosPerfil.fotoUrl && (
                <button onClick={removerFoto}>
                  🗑 Remover
                </button>
              )}

            </div>
          )}
        </div>

      </div>

      {/* CONTEÚDO */}
      <div className="conteudo">

        {editando ? (
          <div className="form">

            <input
              value={dadosPerfil.nome}
              onChange={e =>
                setDadosPerfil({ ...dadosPerfil, nome: e.target.value })
              }
              placeholder="Nome"
            />

            <input
              value={dadosPerfil.local}
              onChange={e =>
                setDadosPerfil({ ...dadosPerfil, local: e.target.value })
              }
              placeholder="Cidade"
            />

            <textarea
              maxLength={LIMITE_BIO}
              value={dadosPerfil.bio}
              onChange={e =>
                setDadosPerfil({ ...dadosPerfil, bio: e.target.value })
              }
            />

            <button onClick={salvarPerfil}>
              {salvando ? 'Salvando...' : 'Salvar'}
            </button>

          </div>
        ) : (
          <>
            <h1>{dadosPerfil.nome}</h1>
            {dadosPerfil.local && <p className="local">📍 {dadosPerfil.local}</p>}
            <p className="bio">{dadosPerfil.bio}</p>

            <button className="editar" onClick={() => setEditando(true)}>
              Editar perfil
            </button>
          </>
        )}

      </div>

      {/* MODAL CROP */}
      {imagemTemp && (
        <div className="crop-modal">

          <Cropper
            image={imagemTemp}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(area, pixels) => setAreaCrop(pixels)}
          />

          <div className="crop-buttons">
            <button onClick={salvarImagem}>Salvar</button>
            <button onClick={() => setImagemTemp(null)}>Cancelar</button>
          </div>

        </div>
      )}

    </div>
  )
}

export default Perfil