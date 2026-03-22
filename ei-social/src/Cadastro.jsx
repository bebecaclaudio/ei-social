import { useState, useEffect } from 'react'
import { auth } from './firebase-config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

const inputBaseStyle = {
  width: '100%',
  padding: '12px 15px',
  borderRadius: '10px',
  marginBottom: '10px',
  fontSize: '14px',
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
      setErro('Resultado do captcha incorreto!')
      gerarCaptcha();
      return
    }
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha || !form.nascimento || !form.cidade || !form.sexo) {
      setErro('Preencha os campos obrigatórios!')
      return
    }
    setCarregando(true)
    try {
      const resultado = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(resultado.user, { displayName: form.nome })
    } catch (e) {
      setErro('Erro no cadastro. Verifique os dados.');
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
        /* Remove setas do input number */
        input::-webkit-outer-spin-button, input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>

      {/* CONTAINER PRINCIPAL COM SCROLL */}
      <div style={{
        minHeight: '100vh',
        width: '100vw',
        background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)',
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'flex-start', // Começa do topo para não cortar no mobile
        padding: '40px 20px',
        boxSizing: 'border-box',
        overflowY: 'auto' // Permite scroll se o conteúdo for grande
      }}>
        
        <div style={{
          background: 'rgba(0,0,0,0.35)', 
          backdropFilter: 'blur(20px)',
          borderRadius: '24px', 
          padding: '30px 25px', 
          width: '100%', 
          maxWidth: '400px',
          textAlign: 'center', 
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', 
          border: '1px solid rgba(255,255,255,0.12)',
          flexShrink: 0 // Impede o card de "esmagar"
        }}>
          
          <img src="/logo.png" alt="Ei" style={{ height: '50px', marginBottom: '15px' }} />
          <p style={{ color: 'white', fontSize: '16px', fontWeight: '600', marginBottom: '20px' }}>Nova Conta</p>
          
          {erro && <p style={{ color: '#ffdf00', fontSize: '13px', marginBottom: '15px' }}>⚠️ {erro}</p>}

          <input name="nome" type="text" placeholder={focado === 'nome' ? "" : "Nome completo"} 
            value={form.nome} onChange={handleChange} onFocus={() => setFocado('nome')} onBlur={() => setFocado('')}
            style={getInputStyle(focado === 'nome')} />

          <input name="email" type="email" placeholder={focado === 'email' ? "" : "E-mail"} 
            value={form.email} onChange={handleChange} onFocus={() => setFocado('email')} onBlur={() => setFocado('')}
            style={getInputStyle(focado === 'email')} />

          <div style={{ position: 'relative' }}>
            <input name="senha" type={mostrarSenha ? "text" : "password"} placeholder={focado === 'senha' ? "" : "Senha"} 
              value={form.senha} onChange={handleChange} onFocus={() => setFocado('senha')} onBlur={() => setFocado('')}
              style={getInputStyle(focado === 'senha')} />
            <span onClick={() => setMostrarSenha(!mostrarSenha)} style={{ position: 'absolute', right: '12px', top: '10px', cursor: 'pointer', fontSize: '18px' }}>
              {mostrarSenha ? '👁️' : '🙈'}
            </span>
          </div>

          <input name="confirmarSenha" type={mostrarSenha ? "text" : "password"} placeholder={focado === 'conf' ? "" : "Confirme a Senha"} 
            value={form.confirmarSenha} onChange={handleChange} onFocus={() => setFocado('conf')} onBlur={() => setFocado('')}
            style={getInputStyle(focado === 'conf', form.confirmarSenha && form.senha !== form.confirmarSenha)} />

          <div style={{ display: 'flex', gap: '8px' }}>
            <input name="cidade" type="text" placeholder="Cidade" 
              value={form.cidade} onChange={handleChange} style={getInputStyle(false)} />
            <select name="sexo" value={form.sexo} onChange={handleChange}
              style={{ ...getInputStyle(false), color: form.sexo === '' ? 'rgba(255,255,255,0.5)' : 'white' }}>
              <option value="" disabled>Sexo</option>
              <option value="masculino">M</option>
              <option value="feminino">F</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '5px' }}>Nascimento:</label>
            <input name="nascimento" type="date" value={form.nascimento} onChange={handleChange} style={getInputStyle(false)} />
          </div>

          <div style={{ background: 'rgba(255,223,0,0.05)', padding: '12px', borderRadius: '10px', marginBottom: '15px', border: '1px dashed rgba(255,223,0,0.3)' }}>
            <p style={{ color: '#ffdf00', fontSize: '13px', marginBottom: '8px' }}>Captcha: {captcha.num1} + {captcha.num2} = ?</p>
            <input type="number" value={captcha.respostaUser} onChange={(e) => setCaptcha({...captcha, respostaUser: e.target.value})}
              style={{ ...getInputStyle(false), marginBottom: 0, textAlign: 'center' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginBottom: '20px' }}>
            <input type="checkbox" checked={termos} onChange={(e) => setTermos(e.target.checked)} style={{ accentColor: '#ffdf00' }} />
            <p style={{ color: 'white', fontSize: '11px', textAlign: 'left', margin: 0 }}>Aceito os Termos e Privacidade.</p>
          </div>

          <button onClick={cadastrar} disabled={carregando} style={{
            width: '100%', padding: '14px', borderRadius: '12px', border: 'none',
            background: '#ffdf00', color: '#002776', fontWeight: '800', cursor: 'pointer'
          }}>
            {carregando ? 'CARREGANDO...' : 'FINALIZAR CADASTRO'}
          </button>

          <p onClick={onVoltar} style={{ color: 'rgba(255,255,255,0.6)', marginTop: '15px', fontSize: '13px', cursor: 'pointer' }}>
            Voltar para o Login
          </p>
        </div>
      </div>
    </>
  )
}

export default Cadastro