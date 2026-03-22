import { useState } from 'react'

function Cadastro({ onVoltar }) {
  const [form, setForm] = useState({ nome: '', email: '', senha: '', nascimento: '' })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: 'rgba(255,255,255,0.12)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px',
        padding: '50px 40px',
        width: '100%',
        maxWidth: '400px',
        textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}>
        <h1 style={{ fontSize: '70px', color: 'white', fontWeight: '900', lineHeight: 1 }}>Ei</h1>
        <p style={{ color: 'white', fontSize: '16px', margin: '8px 0 28px' }}>
          Crie sua conta
        </p>

        <input name="nome" type="text" placeholder="Seu nome completo"
          value={form.nome} onChange={handleChange}
          style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: 'none', marginBottom: '12px', fontSize: '15px', background: 'white', outline: 'none', display: 'block' }}
        />

        <input name="email" type="email" placeholder="seu@email.com"
          value={form.email} onChange={handleChange}
          style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: 'none', marginBottom: '12px', fontSize: '15px', background: 'white', outline: 'none', display: 'block' }}
        />

        <input name="senha" type="password" placeholder="Crie uma senha"
          value={form.senha} onChange={handleChange}
          style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: 'none', marginBottom: '12px', fontSize: '15px', background: 'white', outline: 'none', display: 'block' }}
        />

        <input name="nascimento" type="date"
          value={form.nascimento} onChange={handleChange}
          style={{ width: '100%', padding: '14px 18px', borderRadius: '12px', border: 'none', marginBottom: '20px', fontSize: '15px', background: 'white', outline: 'none', display: 'block' }}
        />

        <button style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: '#ffdf00', color: '#002776', fontWeight: '800',
          fontSize: '16px', cursor: 'pointer', marginBottom: '16px'
        }}>
          Criar minha conta
        </button>

        <p style={{ color: 'white', fontSize: '14px' }}>
          Ja tem conta?{' '}
          <span onClick={onVoltar} style={{ color: '#ffdf00', fontWeight: 'bold', cursor: 'pointer' }}>
            Entrar
          </span>
        </p>
      </div>
    </div>
  )
}

export default Cadastro