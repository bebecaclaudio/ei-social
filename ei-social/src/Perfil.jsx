import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)

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
    if (!usuario?.uid) return

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
    }
    reader.readAsDataURL(file)
  }

  if (carregando) return <div>Carregando...</div>

  return (
    <div>

      {/* BANNER */}
      <div style={{
        height: 200,
        background: 'linear-gradient(135deg,#002776,#009c3b,#ffdf00)'
      }} />

      {/* FOTO */}
      <div style={{ marginTop: -50, textAlign: 'center' }}>
        {foto
          ? <img
              src={foto}
              style={{
                width: 100,
                height: 100,
                borderRadius: '50%',
                objectFit: 'cover'
              }}
            />
          : <div style={{ fontSize: 50 }}>👤</div>
        }

        <div>
          <input type="file" onChange={uploadFoto} />
        </div>
      </div>

      {/* CONTEÚDO */}
      <div style={{ textAlign: 'center', marginTop: 20 }}>
        <h2>{dadosPerfil.nome}</h2>
        {dadosPerfil.local && <p>{dadosPerfil.local}</p>}
        <p>{dadosPerfil.bio}</p>
      </div>

    </div>
  )
}

export default Perfil