import { useState, useEffect } from 'react'
import { db, storage } from './firebase-config' // Certifique-se de exportar 'storage' no seu config
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [menuFoto, setMenuFoto] = useState(false)
  const [subindoFoto, setSubindoFoto] = useState(false) // Estado para o loading da foto
  const LIMITE_BIO = 160

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
        
        const infoBase = {
          nome: usuario.displayName || usuario.email?.split('@')[0] || 'Usuário',
          bio: '',
          local: ''
        }

        if (docSnap.exists()) {
          const data = docSnap.data()
          setDadosPerfil({
            nome: data.nome || infoBase.nome,
            bio: data.bio || '',
            local: data.local || ''
          })
          setFoto(data.foto || usuario.photoURL || '')
        } else {
          setDadosPerfil(infoBase)
          setFoto(usuario.photoURL || '')
        }
      } catch (error) {
        console.error("Erro ao carregar:", error)
      } finally {
        setCarregando(false)
      }
    }
    carregarDados()
  }, [usuario])

  // FUNÇÃO DE UPLOAD REAL PARA O STORAGE
  async function handleFotoUpload(e) {
    const file = e.target.files[0]
    if (!file || !usuario?.uid) return
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Imagem muito grande! Máximo 2MB.')
      return
    }

    try {
      setSubindoFoto(true)
      // 1. Criar a referência no Storage (Pasta usuarios / id do usuario / perfil.png)
      const storageRef = ref(storage, `usuarios/${usuario.uid}/perfil.png`)
      
      // 2. Fazer o upload do arquivo
      await uploadBytes(storageRef, file)
      
      // 3. Pegar a URL pública gerada
      const urlGeral = await getDownloadURL(storageRef)
      
      // 4. Atualizar o estado e o banco de dados imediatamente para a foto "não sumir"
      setFoto(urlGeral)
      await setDoc(doc(db, 'usuarios', usuario.uid), { foto: urlGeral }, { merge: true })
      
      setMenuFoto(false)
      alert('Foto atualizada!')
    } catch (error) {
      console.error("Erro no upload:", error)
      alert('Erro ao subir a imagem.')
    } finally {
      setSubindoFoto(false)
    }
  }

  async function salvarAlteracoes() {
    if (!usuario?.uid) return
    if (dadosPerfil.bio.length > LIMITE_BIO) {
      alert('Sua bio está muito longa!')
      return
    }
    try {
      await setDoc(doc(db, 'usuarios', usuario.uid), { 
        ...dadosPerfil, 
        foto, // Aqui salvamos a URL que veio do Storage
        uid: usuario.uid,
        ultimaAtualizacao: new Date()
      }, { merge: true })
      setEditando(false)
      alert('Perfil atualizado com sucesso!')
    } catch (error) {
      console.error(error)
      alert('Erro ao salvar no banco de dados.')
    }
  }

  if (carregando) return (
    <div style={{ textAlign: 'center', padding: '50px', fontFamily: 'sans-serif' }}>
      Carregando perfil...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px', fontFamily: 'sans-serif' }}>

      {/* BANNER */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)',
        position: 'relative'
      }}>

        {/* AVATAR CONTAINER */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 5
        }}>
          <div style={{
            width: '120px', height: '120px', borderRadius: '50%',
            background: 'white', border: '4px solid white',
            overflow: 'hidden', position: 'relative',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '50px'
          }}>
            {subindoFoto ? (
               <span style={{ fontSize: '14px', color: '#666' }}>Subindo...</span>
            ) : foto ? (
              <img src={foto} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : '👤'}

            <div
              onClick={() => setMenuFoto(!menuFoto)}
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                opacity: 0, cursor: 'pointer', transition: '0.3s'
              }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = 1}
              onMouseLeave={(e) => e.currentTarget.style.opacity = 0}
            >
              <span style={{ fontSize: '24px' }}>📷</span>
            </div>
          </div>

          {menuFoto && (
            <div style={{
              position: 'absolute', top: '130px', left: '50%',
              transform: 'translateX(-50%)',
              background: 'white', borderRadius: '12px', padding: '10px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              display: 'flex', flexDirection: 'column', gap: '8px',
              minWidth: '160px', zIndex: 100
            }}>
              <label style={{
                fontSize: '13px', padding: '10px', borderRadius: '8px',
                background: '#eef2ff', color: '#002776', fontWeight: '600',
                cursor: 'pointer', textAlign: 'center'
              }}>
                {subindoFoto ? 'Enviando...' : 'Nova Foto'}
                <input type="file" accept="image/*" onChange={handleFotoUpload} style={{ display: 'none' }} disabled={subindoFoto} />
              </label>
              
              <button
                onClick={() => setMenuFoto(false)}
                style={{ border: 'none', background: 'none', color: '#888', fontSize: '12px', cursor: 'pointer' }}
              >Fechar</button>
            </div>
          )}
        </div>

        <button
          onClick={() => setEditando(!editando)}
          style={{
            position: 'absolute', right: '20px', bottom: '20px',
            padding: '10px 20px', borderRadius: '25px', border: 'none',
            background: editando ? '#ff4444' : 'white',
            color: editando ? 'white' : '#333',
            fontWeight: 'bold', cursor: 'pointer', fontSize: '14px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}
        >
          {editando ? 'Cancelar' : 'Editar Perfil'}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '70px', padding: '0 20px' }}>
        {editando ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
            <input
              placeholder="Seu nome"
              value={dadosPerfil.nome}
              onChange={(e) => setDadosPerfil({ ...dadosPerfil, nome: e.target.value })}
              style={{ fontSize: '18px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', maxWidth: '300px', textAlign: 'center' }}
            />
            <input
              placeholder="Sua cidade"
              value={dadosPerfil.local}
              onChange={(e) => setDadosPerfil({ ...dadosPerfil, local: e.target.value })}
              style={{ fontSize: '14px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', width: '100%', maxWidth: '300px', textAlign: 'center' }}
            />
            <textarea
              placeholder="Sua bio..."
              maxLength={LIMITE_BIO}
              value={dadosPerfil.bio}
              onChange={(e) => setDadosPerfil({ ...dadosPerfil, bio: e.target.value })}
              style={{ width: '100%', maxWidth: '300px', height: '100px', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', resize: 'none' }}
            />
            <button
              onClick={salvarAlteracoes}
              style={{ background: '#009c3b', color: 'white', border: 'none', padding: '12px 40px', borderRadius: '25px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px', fontSize: '16px' }}
            >
              Salvar Alterações
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontSize: '24px', margin: '0 0 5px', color: '#1a1a1a' }}>{dadosPerfil.nome}</h2>
            {dadosPerfil.local && ( <p style={{ margin: '0 0 15px', color: '#666', fontSize: '14px' }}>📍 {dadosPerfil.local}</p> )}
            <p style={{ maxWidth: '450px', margin: '0 auto', color: '#444', lineHeight: '1.5', fontSize: '15px', whiteSpace: 'pre-wrap' }}>
              {dadosPerfil.bio || 'Nenhuma biografia definida.'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

export default Perfil