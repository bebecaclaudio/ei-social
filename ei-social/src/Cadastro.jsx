import { useState } from 'react'
import { auth } from './firebase-config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

const inputStyle = (focado) => ({
  width: '100%',
  padding: '14px 18px',
  borderRadius: '12px',
  border: focado ? '2px solid #ffdf00' : '2px solid transparent',
  marginBottom: '12px',
  fontSize: '15px',
  background: 'rgba(255,255,255,0.95)',
  outline: 'none',
  color: '#111',
  boxSizing: 'border-box',
  transition: 'border 0.2s'
})

function Cadastro({ onVoltar }) {
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cidade: '', sexo: ''
  })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [focado, setFocado] = useState('')
  const [termos, setTermos] = useState(false)

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  function calcularIdade(nascimento) {
    const nasc = new Date(nascimento)
    const hoje = new Date()
    const idade = hoje.getFullYear() - nasc.getFullYear()
    const aniversarioPassou = hoje.getMonth() > nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate())
    return aniversarioPassou ? idade : idade - 1
  }

  async function cadastrar() {
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha || !form.nascimento || !form.cidade || !form.sexo) {
      setErro('Preencha todos os campos obrigatorios!')
      return
    }
    if (form.senha.length < 6) {
      setErro('A senha precisa ter pelo menos 6 caracteres!')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas nao coincidem!')
      return
    }
    if (calcularIdade(form.nascimento) < 16) {
      setErro('Voce precisa ter pelo menos 16 anos para se cadastrar!')
      return
    }
    if (!termos) {
      setErro('Voce precisa aceitar os termos de uso!')
      return
    }
    setCarregando(true)
    try {
      const resultado = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(resultado.user, { displayName: form.nome })
    } catch (e) {
      if (e.code === 'auth/email-already-in-use') {
        setErro('Este email ja esta cadastrado!')
      } else {
        setErro('Erro ao cadastrar. Tenta de novo!')
      }
      setCarregando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '24px 0'
    }}>
      <div style={{
        background: 'rgba(0,0,0,0.35)',
        backdropFilter: 'blur(20px)',
        borderRadius: '24px', padding: '40px 40px', width: '100%',
        maxWidth: '420px', textAlign: 'center',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        border: '1px solid rgba(255,255,255,0.15)'
      }}>
        <img src="/logo.png" alt="Ei" style={{ width: '100px', marginBottom: '12px' }} />
        <p style={{ color: 'white', fontSize: '16px', margin: '0 0 20px' }}>
          Crie sua conta
        </p>

        {erro && (
          <p style={{ color: '#ffdf00', fontSize: '14px', marginBottom: '12px', fontWeight: '700' }}>
            ⚠️ {erro}
          </p>
        )}

        <input name="nome" type="text" placeholder="Seu nome completo"
          value={form.nome} onChange={handleChange}
          onFocus={function() { setFocado('nome') }}
          onBlur={function() { setFocado('') }}
          style={inputStyle(focado === 'nome')}
        />

        <input name="email" type="email" placeholder="seu@email.com"
          value={form.email} onChange={handleChange}
          onFocus={function() { setFocado('email') }}
          onBlur={function() { setFocado('') }}
          style={inputStyle(focado === 'email')}
        />

        <input name="senha" type="password" placeholder="Crie uma senha (min. 6 caracteres)"
          value={form.senha} onChange={handleChange}
          onFocus={function() { setFocado('senha') }}
          onBlur={function() { setFocado('') }}
          style={inputStyle(focado === 'senha')}
        />

        <input name="confirmarSenha" type="password" placeholder="Confirme sua senha"
          value={form.confirmarSenha} onChange={handleChange}
          onFocus={function() { setFocado('confirmarSenha') }}
          onBlur={function() { setFocado('') }}
          style={{
            ...inputStyle(focado === 'confirmarSenha'),
            border: form.confirmarSenha && form.senha !== form.confirmarSenha
              ? '2px solid #ff4444'
              : form.confirmarSenha && form.senha === form.confirmarSenha
              ? '2px solid #00cc44'
              : focado === 'confirmarSenha' ? '2px solid #ffdf00' : '2px solid transparent'
          }}
        />

        <input name="telefone" type="tel" placeholder="Telefone (opcional)"
          value={form.telefone} onChange={handleChange}
          onFocus={function() { setFocado('telefone') }}
          onBlur={function() { setFocado('') }}
          style={inputStyle(focado === 'telefone')}
        />

        <input name="cidade" type="text" placeholder="Sua cidade"
          value={form.cidade} onChange={handleChange}
          onFocus={function() { setFocado('cidade') }}
          onBlur={function() { setFocado('') }}
          style={inputStyle(focado === 'cidade')}
        />

        <select name="sexo" value={form.sexo} onChange={handleChange}
          onFocus={function() { setFocado('sexo') }}
          onBlur={function() { setFocado('') }}
          style={{
            ...inputStyle(focado === 'sexo'),
            color: form.sexo === '' ? '#888' : '#111'
          }}
        >
          <option value="" disabled>Sexo</option>
          <option value="masculino">Masculino</option>
          <option value="feminino">Feminino</option>
          <option value="outro">Outro</option>
          <option value="prefiro_nao_dizer">Prefiro não dizer</option>
        </select>

        <div style={{ marginBottom: '12px', textAlign: 'left' }}>
          <label style={{ color: 'rgba(255,255,255,0.7)', fontSize: '13px', marginBottom: '6px', display: 'block' }}>
            Data de nascimento *
          </label>
          <input name="nascimento" type="date"
            value={form.nascimento} onChange={handleChange}
            onFocus={function() { setFocado('nascimento') }}
            onBlur={function() { setFocado('') }}
            style={{ ...inputStyle(focado === 'nascimento'), marginBottom: '0' }}
          />
        </div>

        <div style={{
          display: 'flex', alignItems: 'flex-start', gap: '10px',
          margin: '16px 0', textAlign: 'left'
        }}>
          <input
            type="checkbox"
            checked={termos}
            onChange={function(e) { setTermos(e.target.checked) }}
            style={{ marginTop: '3px', cursor: 'pointer', width: '16px', height: '16px' }}
          />
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', margin: 0 }}>
            Concordo com os{' '}
            <span style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: '700' }}>
              Termos de Uso
            </span>
            {' '}e a{' '}
            <span style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: '700' }}>
              Politica de Privacidade
            </span>
          </p>
        </div>

        <button onClick={cadastrar} disabled={carregando} style={{
          width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
          background: carregando ? '#ccc' : '#ffdf00', color: '#002776',
          fontWeight: '800', fontSize: '16px',
          cursor: carregando ? 'not-allowed' : 'pointer',
          marginBottom: '16px'
        }}>
          {carregando ? 'Criando conta...' : 'Criar minha conta'}
        </button>

        <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '14px' }}>
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