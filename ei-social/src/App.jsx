import { useState, useEffect } from 'react'
import './App.css'
import { auth } from './firebase-config'
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from 'firebase/auth'
import Feed from './Feed'
import Cadastro from './Cadastro'
import Perfil from './Perfil'
import Comunidades from './Comunidades'
import Layout from './Layout'

const provider = new GoogleAuthProvider()

function Login({ onCadastro }) {
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')

  async function entrar() {
    try {
      await signInWithEmailAndPassword(auth, email, senha)
    } catch (e) {
      setErro('Email ou senha incorretos!')
    }
  }

  async function entrarGoogle() {
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      setErro('Erro ao entrar com Google!')
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(20px)',
        borderRadius: '24px', padding: '50px 40px', width: '100%',
        maxWidth: '400px', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <img src="/logo.png" alt="Ei" style={{ width: '150px', marginBottom: '16px' }} />
        <p style={{ color: 'white', fontSize: '16px', margin: '0 0 32px' }}>
          a rede social brasileira de verdade
        </p>

        {erro && (
          <p style={{ color: '#ffdf00', fontSize: '14px', marginBottom: '12px', fontWeight: '700' }}>
            {erro}
          </p>
        )}

        <input
          type="email"
          placeholder="seu@email.com"
          value={email}
          onChange={function(e) { setEmail(e.target.value) }}
          style={{
            width: '100%', padding: '14px 18px', borderRadius: '12px',
            border: 'none', marginBottom: '12px', fontSize: '15px',
            background: 'white', outline: 'none', boxSizing: 'border-box', color: '#333'
          }}
        />
        <input
          type="password"
          placeholder="senha"
          value={senha}
          onChange={function(e) { setSenha(e.target.value) }}
          style={{
            width: '100%', padding: '14px 18px', borderRadius: '12px',
            border: 'none', marginBottom: '20px', fontSize: '15px',
            background: 'white', outline: 'none', boxSizing: 'border-box', color: '#333'
          }}
        />
        <button onClick={entrar} style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: '#ffdf00', color: '#002776', fontWeight: '800',
          fontSize: '16px', cursor: 'pointer', marginBottom: '12px'
        }}>Entrar</button>
        <button onClick={entrarGoogle} style={{
          width: '100%', padding: '14px', borderRadius: '12px',
          border: '2px solid rgba(255,255,255,0.6)', background: 'transparent',
          color: 'white', fontWeight: '700', fontSize: '15px',
          cursor: 'pointer', marginBottom: '20px'
        }}>Entrar com Google</button>
        <p style={{ color: 'white', fontSize: '14px' }}>
          Nao tem conta?{' '}
          <span onClick={onCadastro} style={{ color: '#ffdf00', fontWeight: 'bold', cursor: 'pointer' }}>
            Cadastre-se
          </span>
        </p>
      </div>
    </div>
  )
}

function App() {
  const [tela, setTela] = useState('login')
  const [usuario, setUsuario] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(function() {
    const unsub = onAuthStateChanged(auth, function(user) {
      setUsuario(user)
      setCarregando(false)
      if (user) setTela('feed')
      else setTela('login')
    })
    return unsub
  }, [])

  async function sair() {
    await signOut(auth)
    setTela('login')
  }

  if (carregando) return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <img src="/logo.png" alt="Ei" style={{ width: '150px', animation: 'pulse 1s infinite' }} />
    </div>
  )

  const logado = usuario !== null && tela !== 'cadastro'

  return (
    <div>
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

      {tela === 'login' && <Login onCadastro={() => setTela('cadastro')} />}
      {tela === 'cadastro' && <Cadastro onVoltar={() => setTela('login')} />}
      {tela === 'feed' && logado && <Feed usuario={usuario} />}
      {tela === 'perfil' && logado && <Perfil usuario={usuario} onSair={sair} />}
      {tela === 'comunidades' && logado && <Comunidades />}
    </div>
  )
}

export default App