import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  
  // Dados começam totalmente vazios
  const [dadosPerfil, setDadosPerfil] = useState({
    nome: '',
    bio: '',
    local: ''
  })

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, "usuarios", usuario.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          setDadosPerfil(docSnap.data())
        }
        // Se não existir, ele continua vazio como definimos no useState
      } catch (error) {
        console.error("Erro ao buscar perfil:", error)
      }
      setCarregando(false)
    }
    carregarDados()
  }, [usuario])

  async function salvarAlteracoes() {
    try {
      await setDoc(doc(db, "usuarios", usuario.uid), dadosPerfil)
      setEditando(false)
      alert("Perfil salvo com sucesso! ✅")
    } catch (error) {
      alert("Erro ao salvar no banco de dados.")
    }
  }

  if (carregando) return <div style={{textAlign:'center', color:'white', padding:'50px'}}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>
      
      {/* BANNER (Seu Design) */}
      <div style={{ height: '200px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' }}>
        <div style={avatarCircle}>👤</div>
        
        {/* Botão de Editar */}
        <button onClick={() => setEditando(!editando)} style={editBtnOverlay}>
          {editando ? "❌ Cancelar" : "✏️ Editar Perfil"}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 16px' }}>
        
        {/* NOME: Se estiver vazio e não estiver editando, mostra "Sem nome" */}
        {editando ? (
          <input 
            placeholder="Digite seu nome real..." 
            value={dadosPerfil.nome} 
            onChange={(e) => setDadosPerfil({...dadosPerfil, nome: e.target.value})}
            style={nomeInputEdit}
          />
        ) : (
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: dadosPerfil.nome ? '#222' : '#999' }}>
            {dadosPerfil.nome || "Nome não preenchido"}
          </h2>
        )}

        <p style={{ color: '#666', fontSize: '14px' }}>{usuario?.email}</p>

        {/* BIO: Se estiver vazia, incentiva o preenchimento */}
        {editando ? (
          <textarea 
            placeholder="Conte algo sobre você..."
            value={dadosPerfil.bio}
            onChange={(e) => setDadosPerfil({...dadosPerfil, bio: e.target.value})}
            style={bioInputEdit}
          />
        ) : (
          <p style={{ color: dadosPerfil.bio ? '#444' : '#999', fontSize: '15px', margin: '12px auto', maxWidth: '400px', fontStyle: dadosPerfil.bio ? 'normal' : 'italic' }}>
            {dadosPerfil.bio || "Nenhuma biografia adicionada ainda."}
          </p>
        )}

        {editando && (
          <button onClick={salvarAlteracoes} style={btnSalvar}>
            💾 Confirmar e Salvar
          </button>
        )}

        {/* ESTATÍSTICAS (Seu Design) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '20px 0' }}>
          {[['0', 'Amigos'], ['0', 'Posts'], ['0', 'Comunidades']].map((item) => (
            <div key={item[1]} style={{ textAlign: 'center' }}>
              <p style={{ fontWeight: '800', fontSize: '20px', color: '#002776' }}>{item[0]}</p>
              <p style={{ color: '#888', fontSize: '13px' }}>{item[1]}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Estilos mantidos conforme sua identidade visual
const avatarCircle = { position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '100px', borderRadius: '50%', background: 'white', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const editBtnOverlay = { position: 'absolute', right: '20px', bottom: '20px', padding: '8px 16px', borderRadius: '20px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' };
const nomeInputEdit = { fontSize: '24px', fontWeight: '800', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '5px', width: '80%', outline: 'none', marginBottom: '5px' };
const bioInputEdit = { width: '80%', margin: '10px auto', display: 'block', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'none', height: '80px' };
const btnSalvar = { background: '#009c3b', color: 'white', border: 'none', padding: '8px 25px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default Perfil