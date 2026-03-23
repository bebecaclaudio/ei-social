import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from './firebase-config'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail
} from 'firebase/auth'

const provider = new GoogleAuthProvider()

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function entrar() {
    if (!email || !senha) {
      setErro('Preencha e-mail e senha!')
      return
    }
    setCarregando(true)
    try {
      await signInWithEmailAndPassword(auth, email, senha)
    } catch (e) {
      setErro('E-mail ou senha incorretos.')
      setCarregando(false)
    }
  }

  async function entrarGoogle() {
    try {
      await signInWithPopup(auth, provider)
    } catch (e) {
      setErro('Erro ao entrar com Google.')
    }
  }

  async function recuperarSenha() {
    if (!email) {
      setErro('Digite seu e-mail acima para recuperar a senha.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      alert('Link de recuperação enviado para seu e-mail!')
    } catch (e) {
      setErro('Erro ao enviar e-mail de recuperação.')
    }
  }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <img src="/logo.png" alt="Ei" style={{ width: '130px', marginBottom: '10px' }} />
        <p style={{ color: 'white', opacity: 0.8, marginBottom: '30px' }}>A rede social brasileira</p>

        {erro && <p style={erroStyle}>{erro}</p>}

        <input
          type="email"
          placeholder="E-mail"
          value={email}
          onChange={(e) => { setEmail(e.target.value); setErro('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') entrar() }}
          style={inputStyle}
        />

        <input
          type="password"
          placeholder="Senha"
          value={senha}
          onChange={(e) => { setSenha(e.target.value); setErro('') }}
          onKeyDown={(e) => { if (e.key === 'Enter') entrar() }}
          style={inputStyle}
        />

        <p onClick={recuperarSenha} style={linkEsqueciStyle}>
          Esqueceu a senha?
        </p>

        <button onClick={entrar} disabled={carregando} style={buttonStyle}>
          {carregando ? 'CARREGANDO...' : 'ENTRAR'}
        </button>

        <div style={divisorStyle}>OU</div>

        <button onClick={entrarGoogle} style={googleButtonStyle}>
          Entrar com Google
        </button>

        <p style={{ color: 'white', marginTop: '25px', fontSize: '14px' }}>
          Novo por aqui?{' '}
          <span onClick={() => navigate('/cadastro')} style={linkCadastrarStyle}>
            Cadastre-se
          </span>
        </p>
      </div>
    </div>
  )
}

const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
}

const cardStyle = {
  background: 'rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(15px)',
  borderRadius: '28px', padding: '40px', width: '100%',
  maxWidth: '380px', textAlign: 'center',
  border: '1px solid rgba(255, 255, 255, 0.2)',
  boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
}

const inputStyle = {
  width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
  marginBottom: '15px', background: 'rgba(255,255,255,0.9)',
  outline: 'none', boxSizing: 'border-box', color: '#111', fontSize: '15px'
}

const buttonStyle = {
  width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
  background: '#ffdf00', color: '#002776', fontWeight: 'bold',
  cursor: 'pointer', fontSize: '16px'
}

const googleButtonStyle = {
  width: '100%', padding: '12px', borderRadius: '12px',
  border: '1px solid white', background: 'transparent',
  color: 'white', fontWeight: '600', cursor: 'pointer'
}

const linkEsqueciStyle = {
  color: 'white', fontSize: '12px', textAlign: 'right', cursor: 'pointer',
  marginTop: '-10px', marginBottom: '20px', textDecoration: 'underline', opacity: 0.8
}

const linkCadastrarStyle = {
  color: '#ffdf00', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'
}

const erroStyle = {
  color: '#ffdf00', background: 'rgba(0,0,0,0.3)', padding: '10px',
  borderRadius: '8px', fontSize: '13px', marginBottom: '15px'
}

const divisorStyle = {
  margin: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px'
}

export default Login