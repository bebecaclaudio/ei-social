import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
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

      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          const data = docSnap.data()

          setDadosPerfil({
            nome: data.nome || usuario.displayName || usuario.email?.split('@')[0],
            bio: data.bio || '',
            local: data.local || ''
          })

          if (data.foto) setFoto(data.foto)
          else if (usuario.photoURL) setFoto(usuario.photoURL)

        } else {
          setDadosPerfil({
            nome: usuario.displayName || usuario.email?.split('@')[0],
            bio: '',
            local: ''
          })

          if (usuario.photoURL) setFoto(usuario.photoURL)
        }

      } catch (e) {
        console.error(e)
      }

      setCarregando(false)
    }

    carregarDados()
  }, [usuario])

  async function salvar() {
    if (!usuario?.uid) return

    await setDoc(doc(db, 'usuarios', usuario.uid), {
      ...dadosPerfil,
      foto
    })

    setEditando(false)
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
        height: 200,
        background: 'linear-gradient(135deg,#002776,#009c3b,#ffdf00)',
        position: 'relative'
      }}>

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
            background: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 50
          }}>

            {foto
              ? <img src={foto} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : '👤'
            }

            {/* OVERLAY BRANCO */}
            <div
              className="camera-overlay"
              onClick={() => setMenuFoto(!menuFoto)}
              style={{
                position: 'absolute',
                inset: 0,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: 0,
                transition: '0.3s',
                cursor: 'pointer'
              }}
            >
              <span style={{ fontSize: 26, color: '#002776' }}>📷</span>
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
                <input type="file" style={{ display: 'none' }} onChange={uploadFoto} />
              </label>

              {foto && (
                <button onClick={() => setFoto('')}>
                  ❌ Remover
                </button>
              )}
            </div>
          )}
        </div>

        {/* BOTÃO EDITAR */}
        <button
          onClick={() => setEditando(!editando)}
          style={{
            position: 'absolute',
            right: 20,
            bottom: 20,
            padding: '8px 16px',
            borderRadius: 20,
            border: 'none',
            background: '#ffdf00',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          ✏️ Editar
        </button>
      </div>

      {/* CONTEÚDO */}
      <div style={{ textAlign: 'center', marginTop: 70 }}>
        <h2>{dadosPerfil.nome}</h2>
        {dadosPerfil.local && <p>📍 {dadosPerfil.local}</p>}
        <p>{dadosPerfil.bio || 'Sem bio ainda...'}</p>
      </div>

    </div>
  )
}

export default Perfil