import { useState, useEffect, useRef } from 'react' // Adicionado useRef
import { db } from './firebase-config'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const fileInputRef = useRef(null) // Adicionado para controlar o arquivo
  const LIMITE_BIO = 160

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: '',
    fotoUrl: '' 
  })

  useEffect(() => {
    async function inicializarPerfil() {
      if (!usuario?.uid) return
      
      try {
        const docRef = doc(db, 'usuarios', usuario.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setDadosPerfil(docSnap.data())
        } else {
          const novoPerfil = {
            nome: usuario.displayName || 'Usuário da Ei',
            bio: 'Sou novo por aqui! 👋',
            local: '',
            fotoUrl: usuario.photoURL || '', 
            criadoEm: serverTimestamp()
          }
          await setDoc(docRef, novoPerfil)
          setDadosPerfil(novoPerfil)
        }
      } catch (error) {
        console.error("Erro ao carregar perfil:", error)
      } finally {
        setCarregando(false)
      }
    }
    inicializarPerfil()
  }, [usuario])

  // --- NOVAS FUNÇÕES PARA O AVATAR ---
  const handleTrocarFoto = (e) => {
    const arquivo = e.target.files[0]
    if (arquivo) {
      const urlTemp = URL.createObjectURL(arquivo)
      setDadosPerfil({ ...dadosPerfil, fotoUrl: urlTemp })
    }
  }

  const apagarFoto = (e) => {
    e.stopPropagation() // Impede de abrir o seletor ao clicar na lixeira
    setDadosPerfil({ ...dadosPerfil, fotoUrl: '' })
  }

  async function salvar() {
    setSalvando(true)
    try {
      const docRef = doc(db, 'usuarios', usuario.uid)
      await setDoc(docRef, dadosPerfil, { merge: true })
      setEditando(false)
      alert("Perfil atualizado! ✨")
    } catch (e) {
      alert("Erro ao salvar. Tente novamente.")
    } finally {
      setSalvando(false)
    }
  }

  if (carregando) return (
    <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center', color: '#002776', fontWeight: 'bold' }}>
      Buscando seus dados...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa' }}>
      
      {/* CSS PARA O HOVER (Não altera seu JSX) */}
      <style>{`
        .avatar-hover:hover .overlay-ei { opacity: 1 !important; }
      `}</style>
      
      {/* HEADER / BANNER BRASILEIRO */}
      <div style={{
        height: '180px',
        background: 'linear-gradient(135deg, #002776 0%, #009c3b 100%)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center'
      }}>
        
        {/* INPUT INVISÍVEL */}
        <input 
          type="file" 
          accept="image/*" 
          ref={fileInputRef} 
          style={{ display: 'none' }} 
          onChange={handleTrocarFoto} 
        />

        {/* FOTO DE PERFIL (AVATAR) - Adicionado Hover e Click */}
        <div 
          className="avatar-hover"
          onClick={() => fileInputRef.current.click()}
          style={{...avatarContainer, cursor: 'pointer', position: 'absolute', bottom: '-50px'}}
        >
          {dadosPerfil.fotoUrl ? (
            <img src={dadosPerfil.fotoUrl} alt="Foto" style={avatarImg} />
          ) : (
            <span style={{ fontSize: '50px' }}>👤</span>
          )}

          {/* OVERLAY DE AÇÕES */}
          <div className="overlay-ei" style={overlayStyle}>
             <span style={{fontSize: '20px'}}>📷</span>
             <span style={{fontSize: '9px', fontWeight: 'bold'}}>TROCAR</span>
             {dadosPerfil.fotoUrl && (
               <button onClick={apagarFoto} style={btnApagar}>🗑️</button>
             )}
          </div>
        </div>
      </div>

      {/* CONTEÚDO DO PERFIL (EXATAMENTE COMO VOCÊ ENVIOU) */}
      <div style={{ marginTop: '60px', padding: '0 20px', textAlign: 'center' }}>
        
        {editando ? (
          <div style={formStyle}>
            <label style={labelStyle}>Nome de Exibição</label>
            <input 
              style={inputStyle}
              value={dadosPerfil.nome}
              onChange={e => setDadosPerfil({...dadosPerfil, nome: e.target.value})}
            />

            <label style={labelStyle}>Onde você mora?</label>
            <input 
              style={inputStyle}
              placeholder="Ex: Botucatu, SP"
              value={dadosPerfil.local}
              onChange={e => setDadosPerfil({...dadosPerfil, local: e.target.value})}
            />

            <label style={labelStyle}>Sua Bio ({dadosPerfil.bio.length}/{LIMITE_BIO})</label>
            <textarea 
              style={{...inputStyle, height: '80px', resize: 'none'}}
              maxLength={LIMITE_BIO}
              value={dadosPerfil.bio}
              onChange={e => setDadosPerfil({...dadosPerfil, bio: e.target.value})}
            />

            <button onClick={salvar} disabled={salvando} style={btnSalvar}>
              {salvando ? 'PROCESSANDO...' : 'SALVAR PERFIL'}
            </button>
            <p onClick={() => setEditando(false)} style={btnCancelar}>Cancelar</p>
          </div>
        ) : (
          <div style={{ maxWidth: '500px', margin: '0 auto' }}>
            <h2 style={{ color: '#111', marginBottom: '5px', fontSize: '28px' }}>{dadosPerfil.nome}</h2>
            {dadosPerfil.local && <p style={{ color: '#009c3b', fontWeight: '600', marginBottom: '15px' }}>📍 {dadosPerfil.local}</p>}
            <p style={{ color: '#555', lineHeight: '1.6', fontSize: '16px', marginBottom: '25px' }}>
              {dadosPerfil.bio}
            </p>
            
            <button onClick={() => setEditando(true)} style={btnEditar}>
              ✏️ EDITAR PERFIL
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// --- ESTILOS (MANTIDOS E ADICIONADOS) ---
const overlayStyle = {
  position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
  background: 'rgba(0,0,0,0.5)', color: 'white', display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', opacity: 0, transition: '0.3s'
}

const btnApagar = {
  background: 'red', border: 'none', borderRadius: '50%', 
  width: '25px', height: '25px', cursor: 'pointer', marginTop: '5px'
}

const avatarContainer = {
  width: '110px', height: '110px',
  borderRadius: '50%', background: 'white', border: '4px solid white',
  boxShadow: '0 4px 15px rgba(0,0,0,0.15)', overflow: 'hidden',
  display: 'flex', alignItems: 'center', justifyContent: 'center'
}

const avatarImg = { width: '100%', height: '100%', objectFit: 'cover' }
const formStyle = { display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px', margin: '0 auto', textAlign: 'left' }
const labelStyle = { fontSize: '12px', fontWeight: 'bold', color: '#666', marginLeft: '5px' }
const inputStyle = { width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #ddd', fontSize: '15px', outline: 'none', boxSizing: 'border-box' }
const btnEditar = { background: '#ffdf00', color: '#002776', border: 'none', padding: '10px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', fontSize: '14px' }
const btnSalvar = { background: '#009c3b', color: 'white', border: 'none', padding: '15px', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }
const btnCancelar = { color: '#ff4444', cursor: 'pointer', fontSize: '13px', marginTop: '10px', textAlign: 'center', fontWeight: 'bold' }

export default Perfil;