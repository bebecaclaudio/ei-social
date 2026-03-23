import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [menuFoto, setMenuFoto] = useState(false)

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: ''
  })

  const [foto, setFoto] = useState('')

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return

      const ref = doc(db, 'usuarios', usuario.uid)
      const snap = await getDoc(ref)

      if (snap.exists()) {
        const data = snap.data()

        setDadosPerfil({
          nome: data.nome || usuario.displayName || 'Usuário',
          bio: data.bio || '',
          local: data.local || ''
        })

        setFoto(data.foto || usuario.photoURL || '')
      } else {
        setDadosPerfil({
          nome: usuario.displayName || 'Usuário',
          bio: '',
          local: ''
        })

        setFoto(usuario.photoURL || '')
      }

      setCarregando(false)
    }

    carregarDados()
  }, [usuario])

  async function salvar() {
    await setDoc(doc(db, 'usuarios', usuario.uid), {
      ...dadosPerfil,
      foto
    })
  }

  function uploadFoto(e) {
    const file = e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (ev) => {
      setFoto(ev.target.result)
      setMenuFoto(false)
    }
    reader.readAsDataURL(file)
  }

  if (carregando) return <div style={{ padding: 40 }}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5' }}>

      {/* BANNER */}
      <div style={{
        height: 220,
        background: 'linear-gradient(135deg,#002776,#009c3b,#ffdf00)',
        position: 'relative'
      }}>

        {/* NOME COM CONTRASTE */}
        <div style={{
          position: 'absolute',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'rgba(0,0,0,0.45)',
          padding: '6px 16px',
          borderRadius: 20,
          backdropFilter: 'blur(6px)'
        }}>
          <h2 style={{
            color: '#fff',
            margin: 0,
            fontWeight: '600',
            letterSpacing: 0.5
          }}>
            {dadosPerfil.nome}
          </h2>
        </div>

        {/* AVATAR */}
        <div style={{
          position: 'absolute',
          bottom: -55,
          left: '50%',
          transform: 'translateX(-50%)'
        }}>

          <div className="avatar-hover" style={{
            width: 110,
            height: 110,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            border: '4px solid white',
            background: '#fff'
          }}>

            {foto
              ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : <div style={{ fontSize: 50, textAlign: 'center' }}>👤</div>
            }

            {/* OVERLAY */}
            <div
              className="camera-overlay"
              onClick={() => setMenuFoto(!menuFoto)}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: '0.3s',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: 26 }}>📷</span>
            </div>
          </div>

          {/* MENU FOTO */}
          {menuFoto && (
            <div style={{
              marginTop: 10,
              background: '#fff',
              padding: 10,
              borderRadius: 10,
              boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              alignItems: 'center'
            }}>
              <label style={{ cursor: 'pointer' }}>
                📤 Enviar
                <input type="file" hidden onChange={uploadFoto} />
              </label>

              {foto && (
                <button onClick={() => setFoto('')}>
                  ❌ Remover
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ textAlign: 'center', marginTop: 70 }}>
        {dadosPerfil.local && <p>📍 {dadosPerfil.local}</p>}
        <p>{dadosPerfil.bio || 'Sem bio ainda...'}</p>
      </div>

    </div>
  )
}

export default Perfil