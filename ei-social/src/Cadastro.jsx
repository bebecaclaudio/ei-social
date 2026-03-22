import { useState, useEffect } from 'react'
import { auth } from './firebase-config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

const inputBaseStyle = {
  width: '100%',
  padding: '14px 18px',
  borderRadius: '12px',
  marginBottom: '12px',
  fontSize: '15px',
  background: 'rgba(255, 255, 255, 0.08)', 
  backdropFilter: 'blur(5px)',
  outline: 'none',
  color: '#ffffff', 
  boxSizing: 'border-box',
  transition: 'all 0.2s ease-in-out',
  WebkitAppearance: 'none', 
}

const getInputStyle = (focado, temErro = false) => ({
  ...inputBaseStyle,
  border: `2px solid ${temErro ? '#ff4444' : focado ? '#ffdf00' : 'rgba(255, 255, 255, 0.15)'}`,
  background: focado ? 'rgba(255, 255, 255, 0.12)' : 'rgba(255, 255, 255, 0.08)',
});

function Cadastro({ onVoltar }) {
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cidade: '', sexo: ''
  })
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, respostaUser: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [focado, setFocado] = useState('')
  const [termos, setTermos] = useState(false)
  
  // NOVO: Estado para mostrar/esconder senha
  const [mostrarSenha, setMostrarSenha] = useState(false);

  useEffect(() => {
    gerarCaptcha();
  }, [])

  function gerarCaptcha() {
    setCaptcha({
      num1: Math.floor(Math.random() * 9) + 1,
      num2: Math.floor(Math.random() * 9) + 1,
      respostaUser: ''
    })
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  async function cadastrar() {
    setErro('')
    if (parseInt(captcha.respostaUser) !== (captcha.num1 + captcha.num2)) {
      setErro('Resultado do desafio matemático incorreto!')
      gerarCaptcha();
      return
    }
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha || !form.nascimento || !form.cidade || !form.sexo) {
      setErro('Preencha todos os campos obrigatórios!')
      return
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem!')
      return
    }
    setCarregando(true)
    try {
      const resultado = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(resultado.user, { displayName: form.nome })
    } catch (e) {
      setErro(e.code === 'auth/email-already-in-use' ? 'Email já cadastrado!' : 'Erro ao cadastrar.');
      setCarregando(false)
      gerarCaptcha();
    }
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill {
          -webkit-text-fill-color: #ffffff !important;
          -webkit-box-shadow: 0 0 0px 1000px rgba(10, 30, 10, 0.9) inset !important;
        }
        input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
      `}</style>

      <div style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.30)', backdropFilter: 'blur(25px)',
          borderRadius: '24px', padding: '40px', width: '100%', maxWidth: '450px',
          textAlign: 'center', boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)'
        }}>
          <img src="/logo.png" alt="Ei" style={{ height: '60px', marginBottom: '20px' }} />
          
          {erro && <p style={{ color: '#ffdf00', background: 'rgba(255,223,0,0.15)', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '15px' }}>⚠️ {erro}</p>}

          <input name="nome" type="text" placeholder={focado === 'nome' ? "" : "Nome completo"} 
            value={form.nome} onChange={handleChange} onFocus={() => setFocado('nome')} onBlur={() => setFocado('')}
            style={getInputStyle(focado === 'nome')} />

          <input name="email" type="email" placeholder={focado === 'email' ? "" : "seu@email.com"} 
            value={form.email} onChange={handleChange} onFocus={() => setFocado('email')} onBlur={() => setFocado('')}
            style={getInputStyle(focado === 'email')} />

          {/* CAMPOS DE SENHA COM OLHINHO */}
          <div style={{ position: 'relative' }}>
            <input 
              name="senha" 
              type={mostrarSenha ? "text" : "password"} 
              placeholder={focado === 'senha' ? "" : "Crie uma Senha"} 
              value={form.senha} onChange={handleChange} 
              onFocus={() => setFocado('senha')} onBlur={() => setFocado('')}
              style={getInputStyle(focado === 'senha')} 
            />
            <span 
              onClick={() => setMostrarSenha(!mostrarSenha)}
              style={{
                position: 'absolute', right: '15px', top: '12px', 
                cursor: 'pointer', fontSize: '20px', userSelect: 'none',
                opacity: 0.7
              }}
            >
              {mostrarSenha ? '👁️' : '🙈'}
            </span>
          </div>

          <input 
            name="confirmarSenha" 
            type={mostrarSenha ? "text" : "password"} 
            placeholder={focado === 'confirmar' ? "" : "Confirme a Senha"} 
            value={form.confirmarSenha} onChange={handleChange} 
            onFocus={() => setFocado('confirmar')} onBlur={() => setFocado('')}
            style={getInputStyle(focado === 'confirmar', form.confirmarSenha && form.senha !== form.confirmarSenha)} 
          />

          {/* DEMAIS CAMPOS */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <input name="cidade" type="text" placeholder={focado === 'cidade' ? "" : "Cidade"} 
              value={form.cidade} onChange={handleChange} onFocus={() => setFocado('cidade')} onBlur={() => setFocado('')}
              style={getInputStyle(focado === 'cidade')} />

            <select name="sexo" value={form.sexo} onChange={handleChange} onFocus={() => setFocado('sexo')} onBlur={() => setFocado('')}
              style={{ ...getInputStyle(focado === 'sexo'), color: form.sexo === '' ? 'rgba(255,255,255,0.5)' : 'white' }}>
              <option value="" disabled>Sexo</option>
              <option value="masculino">Masc</option>
              <option value="feminino">Fem</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div style={{ background: 'rgba(255,223,0,0.05)', padding: '15px', borderRadius: '12px', marginBottom: '15px', border: '1px dashed rgba(255,223,0,0.3)' }}>
            <p style={{ color: '#ffdf00', fontSize: '14px', marginBottom: '10px', fontWeight: 'bold' }}>
              Quanto é {captcha.num1} + {captcha.num2}?
            </p>
            <input type="number" placeholder={focado === 'captcha' ? "" : "Resposta"}
              value={captcha.respostaUser} onChange={(e) => setCaptcha({...captcha, respostaUser: e.target.value})}
              onFocus={() => setFocado('captcha')} onBlur={() => setFocado('')}
              style={{ ...getInputStyle(focado === 'captcha'), marginBottom: 0 }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px', textAlign: 'left' }}>
            <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: '#ffdf00' }} />
            <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>Aceito os Termos e Políticas.</p>
          </div>

          <button onClick={cadastrar} disabled={carregando} style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: '#ffdf00', color: '#002776', fontWeight: '800', fontSize: '16px', cursor: 'pointer'
          }}>
            {carregando ? 'PROCESSANDO...' : 'CRIAR MINHA CONTA'}
          </button>

          <p style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px', fontSize: '14px' }}>
            Já tem conta? <span onClick={onVoltar} style={{ color: '#ffdf00', fontWeight: 'bold', cursor: 'pointer' }}>Entrar</span>
          </p>
        </div>
      </div>
    </>
  )
}

export default Cadastro