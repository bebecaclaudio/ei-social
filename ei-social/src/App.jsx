import { useState } from 'react'
import './App.css'
import Feed from './Feed'
import Cadastro from './Cadastro'
import Perfil from './Perfil'
import Comunidades from './Comunidades'
import Layout from './Layout'

function Login({ onCadastro, onEntrar }) {
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
        <input type="email" placeholder="seu@email.com" style={{
          width: '100%', padding: '14px 18px', borderRadius: '12px',
          border: 'none', marginBottom: '12px', fontSize: '15px',
          background: 'white', outline: 'none', boxSizing: 'border-box'
        }} />
        <input type="password" placeholder="senha" style={{
          width: '100%', padding: '14px 18px', borderRadius: '12px',
          border: 'none', marginBottom: '20px', fontSize: '15px',
          background: 'white', outline: 'none', boxSizing: 'border-box'
        }} />
        <button onClick={onEntrar} style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: '#ffdf00', color: '#002776', fontWeight: '800',
          fontSize: '16px', cursor: 'pointer', marginBottom: '12px'
        }}>Entrar</button>
        <button onClick={onEntrar} style={{
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
  const logado = tela !== 'login' && tela !== 'cadastro'

  return (
    <div>
      {logado && (
        <Layout
          tela={tela}
          onFeed={() => setTela('feed')}
          onComunidades={() => setTela('comunidades')}
          onPerfil={() => setTela('perfil')}
        />
      )}

      <div>
        {tela === 'login' && <Login onCadastro={() => setTela('cadastro')} onEntrar={() => setTela('feed')} />}
        {tela === 'cadastro' && <Cadastro onVoltar={() => setTela('login')} />}
        {tela === 'feed' && <Feed />}
        {tela === 'perfil' && <Perfil />}
        {tela === 'comunidades' && <Comunidades />}
      </div>
    </div>
  )
}

export default App