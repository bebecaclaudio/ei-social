import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from './firebase-config'
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  sendPasswordResetEmail,
  onAuthStateChanged
} from 'firebase/auth'

const provider = new GoogleAuthProvider()

function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)

  // --- O VIGIA: Redireciona se o usuário logar (novo ou antigo) ---
  useEffect(() => {
    const monitorar = onAuthStateChanged(auth, (user) => {
      if (user) {
        navigate('/') // Se identificou o usuário, pula para o Feed
      }
    });
    return () => monitorar(); // Limpa o monitor ao fechar a tela
  }, [navigate]);

  // --- LOGIN COM E-MAIL ---
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

  // --- LOGIN COM GOOGLE (Cria conta na hora se for novo!) ---
  async function entrarGoogle() {
    try {
      setCarregando(true)
      await signInWithPopup(auth, provider)
      // O useEffect ali de cima vai perceber o login e te redirecionar!
    } catch (e) {
      setCarregando(false)
      if (e.code === 'auth/popup-closed-by-user') return
      setErro('Erro ao entrar com Google. Verifique se o domínio está autorizado.')
    }
  }

  // --- RECUPERAR SENHA ---
  async function recuperarSenha() {
    if (!email) {
      setErro('Digite seu e-mail acima para recuperar a senha.')
      return
    }
    try {
      await sendPasswordResetEmail(auth, email)
      setSucesso('Link de recuperação enviado para seu e-mail!')
      setErro('')
      setTimeout(() => setSucesso(''), 5000)
    } catch (e) {
      setErro('Erro ao enviar e-mail de recuperação.')
    }
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill {
          -webkit-box-shadow: 0 0 0px 1000px white inset !important;
          -webkit-text-fill-color: #111 !important;
        }
        input::placeholder { color: #888 !important; }
        .btn-hover:hover { opacity: 0.9; transform: translateY(-1px); }
      `}</style>

      <div style={containerStyle}>
        <div style={cardStyle}>
          {/* Logo da Ei */}
          <img src="/logo.png" alt="Ei" style={{ width: '130px', marginBottom: '10px' }} />
          <p style={{ color: 'white', opacity: 0.8, marginBottom: '30px', fontSize: '15px' }}>
            A rede social brasileira
          </p>

          {/* Avisos de Erro ou Sucesso */}
          {erro && <div style={erroStyle}>⚠️ {erro}</div>}
          {sucesso && <div style={sucessoStyle}>✅ {sucesso}</div>}

          {/* Inputs */}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            autoComplete="email"
            onChange={(e) => { setEmail(e.target.value); setErro('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') entrar() }}
            style={inputStyle}
          />

          <input
            type="password"
            placeholder="Senha"
            value={senha}
            autoComplete="current-password"
            onChange={(e) => { setSenha(e.target.value); setErro('') }}
            onKeyDown={(e) => { if (e.key === 'Enter') entrar() }}
            style={inputStyle}
          />

          <p onClick={recuperarSenha} style={linkEsqueciStyle}>
            Esqueceu a senha?
          </p>

          {/* Botão Principal */}
          <button 
            onClick={entrar} 
            disabled={carregando} 
            className="btn-hover"
            style={{
              ...buttonStyle,
              opacity: carregando ? 0.7 : 1,
              cursor: carregando ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {carregando ? 'CARREGANDO...' : 'ENTRAR'}
          </button>

          <div style={divisorStyle}>OU</div>

          {/* Botão Google */}
          <button onClick={entrarGoogle} className="btn-hover" style={googleButtonStyle}>
            <span style={{ marginRight: '8px' }}>🔵</span>
            Entrar com Google
          </button>

          <p style={{ color: 'rgba(255,255,255,0.8)', marginTop: '25px', fontSize: '14px' }}>
            Novo por aqui?{' '}
            <span onClick={() => navigate('/cadastro')} style={linkCadastrarStyle}>
              Cadastre-se
            </span>
          </p>
        </div>
      </div>
    </>
  )
}

// --- ESTILOS REPLICADOS DA SUA IDENTIDADE VISUAL ---
const containerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(160deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px'
}

const cardStyle = {
  background: 'rgba(0, 0, 0, 0.35)',
  backdropFilter: 'blur(20px)',
  borderRadius: '28px', padding: '40px', width: '100%',
  maxWidth: '380px', textAlign: 'center',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  boxShadow: '0 10px 40px rgba(0,0,0,0.3)'
}

const inputStyle = {
  width: '100%', padding: '15px', borderRadius: '12px',
  border: 'none', marginBottom: '15px', background: 'white',
  outline: 'none', boxSizing: 'border-box',
  color: '#111', fontSize: '15px'
}

const buttonStyle = {
  width: '100%', padding: '15px', borderRadius: '12px', border: 'none',
  background: '#ffdf00', color: '#002776', fontWeight: 'bold', fontSize: '16px'
}

const googleButtonStyle = {
  width: '100%', padding: '12px', borderRadius: '12px',
  border: '2px solid rgba(255,255,255,0.5)',
  background: 'rgba(255,255,255,0.1)',
  color: 'white', fontWeight: '600', cursor: 'pointer',
  fontSize: '15px', transition: 'all 0.2s'
}

const linkEsqueciStyle = {
  color: 'rgba(255,255,255,0.7)', fontSize: '12px', textAlign: 'right',
  cursor: 'pointer', marginTop: '-10px', marginBottom: '20px',
  textDecoration: 'underline'
}

const linkCadastrarStyle = {
  color: '#ffdf00', fontWeight: 'bold', cursor: 'pointer', textDecoration: 'underline'
}

const erroStyle = {
  color: '#ffdf00', background: 'rgba(255,50,50,0.2)',
  padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px'
}

const sucessoStyle = {
  color: '#00ff88', background: 'rgba(0,200,100,0.15)',
  padding: '10px', borderRadius: '8px', fontSize: '13px', marginBottom: '15px'
}

const divisorStyle = {
  margin: '20px 0', color: 'rgba(255,255,255,0.4)', fontSize: '12px'
}

export default Login