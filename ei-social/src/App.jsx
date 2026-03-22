import { useState, useEffect } from 'react'
import './App.css'
import { auth } from './firebase-config'
import { signOut, onAuthStateChanged } from 'firebase/auth'

// Importação dos seus componentes (Arquivos separados)
import Login from './Login'
import Feed from './Feed'
import Cadastro from './Cadastro'
import Perfil from './Perfil'
import Comunidades from './Comunidades'
import Layout from './Layout'

function App() {
  const [tela, setTela] = useState('login')
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  // Observador de Login (O Coração do App)
  useEffect(function() {
    const unsub = onAuthStateChanged(auth, function(user) {
      setUsuario(user)
      setCarregando(false)
      // Se logar, vai pro Feed. Se deslogar, vai pro Login.
      if (user) setTela('feed')
      else setTela('login')
    })
    return unsub
  }, [])

  async function sair() {
    await signOut(auth)
    setTela('login')
  }

  // Tela de Carregamento com o Pulse que você criou
  if (carregando) return (
    <div className="loading-container">
      <img src="/logo.png" alt="Ei" className="pulse-animation" />
    </div>
  )

  const logado = usuario !== null && tela !== 'cadastro'

  return (
    <div>
      {/* O Layout (Menu/Barra) só aparece se estiver logado */}
      {logado && (
        <Layout
          tela={tela}
          onFeed={() => setTela('feed')}
          onComunidades={() => setTela('comunidades')}
          onPerfil={() => setTela('perfil')}
          onSair={sair}
          usuario={usuario}
        />
      )}

      {/* Lógica de Troca de Telas */}
      {tela === 'login' && <Login onCadastro={() => setTela('cadastro')} />}
      
      {tela === 'cadastro' && <Cadastro onVoltar={() => setTela('login')} />}

      {/* Telas Internas */}
      {tela === 'feed' && logado && <Feed usuario={usuario} />}
      {tela === 'perfil' && logado && <Perfil usuario={usuario} onSair={sair} />}
      {tela === 'comunidades' && logado && <Comunidades />}
    </div>
  )
}

export default App