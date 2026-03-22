import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  const LIMITE_BIO = 160; // Limite clássico
  
  const [dadosPerfil, setDadosPerfil] = useState({
    nome: usuario?.displayName || usuario?.email?.split('@')[0] || "Usuário",
    bio: '',
    local: 'Botucatu, SP'
  })

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, "usuarios", usuario.uid)
        const docSnap = await getDoc(docRef)
        if (docSnap.exists()) setDadosPerfil(docSnap.data())
      } catch (error) { console.error(error) }
      setCarregando(false)
    }
    carregarDados()
  }, [usuario])

  async function salvarAlteracoes() {
    if (dadosPerfil.bio.length > LIMITE_BIO) {
      alert("Sua bio está muito longa!");
      return;
    }
    try {
      await setDoc(doc(db, "usuarios", usuario.uid), dadosPerfil)
      setEditando(false)
    } catch (e) { alert("Erro ao salvar") }
  }

  if (carregando) return <div style={{textAlign:'center', padding:'50px', color:'white'}}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>
      
      {/* BANNER */}
      <div style={{ height: '200px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' }}>
        <div style={avatarCircle}>👤</div>
        <button onClick={() => setEditando(!editando)} style={editBtnOverlay}>
          {editando ? "❌ Cancelar" : "✏️ Editar Bio"}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 16px' }}>
        
        {/* NOME (Editável mas não vazio) */}
        {editando ? (
          <input 
            value={dadosPerfil.nome} 
            onChange={(e) => setDadosPerfil({...dadosPerfil, nome: e.target.value})}
            style={nomeInputEdit}
          />
        ) : (
          <h2 style={{ fontSize: '24px', fontWeight: '800' }}>{dadosPerfil.nome}</h2>
        )}

        {/* BIO COM CONTADOR */}
        {editando ? (
          <div style={{ position: 'relative', maxWidth: '400px', margin: '0 auto' }}>
            <textarea 
              maxLength={LIMITE_BIO}
              value={dadosPerfil.bio}
              onChange={(e) => setDadosPerfil({...dadosPerfil, bio: e.target.value})}
              style={bioInputEdit}
              placeholder="Sua bio criativa..."
            />
            {/* O CONTADOR MÁGICO */}
            <span style={{
              fontSize: '11px',
              color: dadosPerfil.bio.length >= LIMITE_BIO ? 'red' : '#888',
              display: 'block',
              textAlign: 'right',
              marginTop: '-5px'
            }}>
              {dadosPerfil.bio.length} / {LIMITE_BIO}
            </span>
          </div>
        ) : (
          <p style={{ color: '#444', fontSize: '15px', margin: '12px auto', maxWidth: '400px' }}>
            {dadosPerfil.bio || "Escreva algo sobre você!"}
          </p>
        )}

        {editando && (
          <button onClick={salvarAlteracoes} style={btnSalvar}>💾 Gravar</button>
        )}
      </div>
    </div>
  )
}

// Estilos mantidos (apenas os necessários para o exemplo)
const avatarCircle = { position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '100px', borderRadius: '50%', background: 'white', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px' };
const editBtnOverlay = { position: 'absolute', right: '20px', bottom: '20px', padding: '8px 16px', borderRadius: '20px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer' };
const nomeInputEdit = { fontSize: '20px', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '5px', width: '80%' };
const bioInputEdit = { width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'none', height: '80px', boxSizing: 'border-box' };
const btnSalvar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default Perfil;