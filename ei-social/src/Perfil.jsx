import { useState, useEffect } from 'react'
import { db } from './firebase-config'
import { doc, getDoc, setDoc } from 'firebase/firestore'

function Perfil({ usuario }) {
  const [carregando, setCarregando] = useState(true)
  const [editando, setEditando] = useState(false)
  
  // O "Plano de Fundo" para o perfil nunca ser vazio
  const nomeInicial = usuario?.displayName || usuario?.email?.split('@')[0] || "Usuário Criativo";

  const [dadosPerfil, setDadosPerfil] = useState({
    nome: nomeInicial,
    bio: '',
    local: 'Botucatu, SP'
  })

  useEffect(() => {
    async function carregarDados() {
      if (!usuario?.uid) return
      try {
        const docRef = doc(db, "usuarios", usuario.uid)
        const docSnap = await getDoc(docRef)

        if (docSnap.exists()) {
          // Se já editou antes, carrega o que está no banco
          setDadosPerfil(docSnap.data())
        }
      } catch (error) {
        console.error("Erro ao carregar:", error)
      }
      setCarregando(false)
    }
    carregarDados()
  }, [usuario])

  async function salvarAlteracoes() {
    // Validação: Não deixa salvar se o nome estiver em branco
    if (!dadosPerfil.nome.trim()) {
      alert("O nome não pode ficar vazio!")
      return
    }

    try {
      await setDoc(doc(db, "usuarios", usuario.uid), dadosPerfil)
      setEditando(false)
      alert("Perfil atualizado! ✨")
    } catch (error) {
      alert("Erro ao salvar no Firebase.")
    }
  }

  if (carregando) return <div style={{textAlign:'center', color:'white', padding:'50px'}}>Carregando...</div>

  return (
    <div style={{ minHeight: '100vh', background: '#f0f2f5', paddingBottom: '40px' }}>
      
      {/* BANNER (Seu Design) */}
      <div style={{ height: '200px', background: 'linear-gradient(135deg, #002776, #009c3b, #ffdf00)', position: 'relative' }}>
        <div style={avatarCircle}>👤</div>
        
        <button onClick={() => setEditando(!editando)} style={editBtnOverlay}>
          {editando ? "❌ Cancelar" : "✏️ Editar Perfil"}
        </button>
      </div>

      <div style={{ textAlign: 'center', marginTop: '60px', padding: '0 16px' }}>
        
        {/* NOME EDITÁVEL: Mas sempre com valor inicial */}
        {editando ? (
          <div style={{ marginBottom: '10px' }}>
            <label style={labelStyle}>Nome de Exibição:</label>
            <input 
              value={dadosPerfil.nome} 
              onChange={(e) => setDadosPerfil({...dadosPerfil, nome: e.target.value})}
              style={nomeInputEdit}
              placeholder="Como quer ser chamado?"
            />
          </div>
        ) : (
          <h2 style={{ fontSize: '24px', fontWeight: '800', color: '#222', textTransform: 'capitalize' }}>
            {dadosPerfil.nome}
          </h2>
        )}

        <p style={{ color: '#666', fontSize: '14px' }}>{usuario?.email}</p>

        {/* BIO EDITÁVEL */}
        {editando ? (
          <div style={{ marginTop: '15px' }}>
            <label style={labelStyle}>Sua Bio:</label>
            <textarea 
              value={dadosPerfil.bio}
              onChange={(e) => setDadosPerfil({...dadosPerfil, bio: e.target.value})}
              style={bioInputEdit}
              placeholder="Conte sua história polimata..."
            />
          </div>
        ) : (
          <p style={{ color: '#444', fontSize: '15px', margin: '12px auto', maxWidth: '400px' }}>
            {dadosPerfil.bio || "Clique em editar para adicionar sua biografia!"}
          </p>
        )}

        {editando && (
          <button onClick={salvarAlteracoes} style={btnSalvar}>
            💾 Confirmar Mudanças
          </button>
        )}

        {/* ESTATÍSTICAS (Seu Design Original) */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', margin: '25px 0' }}>
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

// Estilos mantendo sua identidade visual
const labelStyle = { display: 'block', fontSize: '12px', color: '#009c3b', fontWeight: 'bold', marginBottom: '4px' };
const avatarCircle = { position: 'absolute', bottom: '-50px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '100px', borderRadius: '50%', background: 'white', border: '4px solid white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '60px', boxShadow: '0 4px 12px rgba(0,0,0,0.2)' };
const editBtnOverlay = { position: 'absolute', right: '20px', bottom: '20px', padding: '8px 16px', borderRadius: '20px', border: 'none', background: 'white', fontWeight: 'bold', cursor: 'pointer', fontSize: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' };
const nomeInputEdit = { fontSize: '20px', fontWeight: '800', textAlign: 'center', border: '1px solid #ddd', borderRadius: '8px', padding: '8px', width: '80%', outline: 'none' };
const bioInputEdit = { width: '80%', margin: '5px auto', display: 'block', padding: '10px', borderRadius: '8px', border: '1px solid #ddd', fontSize: '14px', resize: 'none', height: '80px', textAlign: 'center' };
const btnSalvar = { background: '#009c3b', color: 'white', border: 'none', padding: '10px 30px', borderRadius: '20px', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' };

export default Perfil;