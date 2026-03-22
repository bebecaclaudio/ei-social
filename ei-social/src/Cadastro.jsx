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
  border: '1px solid rgba(255, 255, 255, 0.15)',
  transition: 'all 0.2s'
}

// Estilo do Modal
const modalOverlayStyle = {
  position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
  background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 9999, padding: '20px'
}

function Cadastro({ onVoltar }) {
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cidade: '', estado: '', pais: 'Brasil', sexo: ''
  })
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, respostaUser: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [modalAtivo, setModalAtivo] = useState(null) // 'termos' ou 'privacidade'

  useEffect(() => {
    setCaptcha({ num1: Math.floor(Math.random() * 9) + 1, num2: Math.floor(Math.random() * 9) + 1, respostaUser: '' })
  }, [])

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function cadastrar() {
    if (parseInt(captcha.respostaUser) !== (captcha.num1 + captcha.num2)) {
      setErro('Captcha incorreto!'); return
    }
    setCarregando(true)
    try {
      const res = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(res.user, { displayName: form.nome })
    } catch (e) { 
      setErro('Erro ao cadastrar. Verifique os dados.'); 
      setCarregando(false)
    }
  }

  return (
    <>
      <style>{`
        input::placeholder { color: rgba(255, 255, 255, 0.4); }
        select option { background: #1a1a1a; color: white; }
        .grid-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
      `}</style>

      {/* MODAL DE TEXTOS LEGAIS */}
      {modalAtivo && (
        <div style={modalOverlayStyle}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '20px', maxWidth: '500px', border: '1px solid #ffdf00' }}>
            <h2 style={{ color: '#ffdf00', marginTop: 0 }}>{modalAtivo === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}</h2>
            <div style={{ color: '#eee', fontSize: '14px', maxHeight: '300px', overflowY: 'auto', marginBottom: '20px', textAlign: 'left' }}>
              {modalAtivo === 'termos' ? (
                <p>Ao se cadastrar no Ei!, você concorda em manter o respeito na rede, não realizar spam e proteger sua senha. O uso da plataforma é destinado à interação social positiva.</p>
              ) : (
                <p>Nós protegemos seus dados. Suas informações de localização (Cidade/Estado) servem apenas para conectar você a pessoas próximas. Não vendemos seus dados para terceiros.</p>
              )}
            </div>
            <button onClick={() => setModalAtivo(null)} style={{ background: '#ffdf00', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      )}

      <div style={{
        minHeight: '100vh', width: '100%', background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', borderRadius: '25px',
          padding: '35px', width: '100%', maxWidth: '440px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <img src="/logo.png" alt="Ei" style={{ height: '55px', marginBottom: '15px' }} />
          <h3 style={{ color: 'white', marginBottom: '25px' }}>Crie sua conta</h3>

          {erro && <p style={{ color: '#ffdf00', fontSize: '13px' }}>{erro}</p>}

          <input name="nome" placeholder="Nome completo" onChange={handleChange} style={inputBaseStyle} />
          <input name="email" type="email" placeholder="E-mail" onChange={handleChange} style={inputBaseStyle} />

          <div style={{ position: 'relative' }}>
            <input name="senha" type={mostrarSenha ? "text" : "password"} placeholder="Senha" onChange={handleChange} style={inputBaseStyle} />
            <span onClick={() => setMostrarSenha(!mostrarSenha)} style={{ position: 'absolute', right: '15px', top: '12px', cursor: 'pointer' }}>{mostrarSenha ? '👁️' : '🙈'}</span>
          </div>

          <input name="confirmarSenha" type={mostrarSenha ? "text" : "password"} placeholder="Confirme a senha" onChange={handleChange} style={inputBaseStyle} />

          <div className="grid-campos">
            <input name="cidade" placeholder="Cidade" onChange={handleChange} style={inputBaseStyle} />
            <input name="estado" placeholder="Estado (ex: SP)" onChange={handleChange} style={inputBaseStyle} />
            <input name="pais" placeholder="País" value={form.pais} onChange={handleChange} style={inputBaseStyle} />
            <select name="sexo" onChange={handleChange} style={inputBaseStyle}>
              <option value="">Sexo</option>
              <option value="M">Masculino</option>
              <option value="F">Feminino</option>
              <option value="O">Outro</option>
            </select>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '15px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '5px' }}>Data de Nascimento:</label>
            <input name="nascimento" type="date" onChange={handleChange} style={{ ...inputBaseStyle, marginTop: '5px' }} />
          </div>

          <div style={{ background: 'rgba(255,223,0,0.1)', padding: '15px', borderRadius: '12px', marginBottom: '20px' }}>
            <p style={{ color: '#ffdf00', fontSize: '13px', margin: '0 0 10px' }}>Segurança: {captcha.num1} + {captcha.num2} = ?</p>
            <input type="number" placeholder="Resultado" onChange={(e) => setCaptcha({...captcha, respostaUser: e.target.value})} style={{ ...inputBaseStyle, marginBottom: 0, textAlign: 'center' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px', textAlign: 'left' }}>
            <input type="checkbox" style={{ accentColor: '#ffdf00', marginTop: '3px' }} />
            <p style={{ color: 'white', fontSize: '12px', margin: 0 }}>
              Aceito os <span onClick={() => setModalAtivo('termos')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Termos</span> e a <span onClick={() => setModalAtivo('privacidade')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Política de Privacidade</span>.
            </p>
          </div>

          <button onClick={cadastrar} disabled={carregando} style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: '#ffdf00', color: '#002776', fontWeight: '900', cursor: 'pointer'
          }}>
            {carregando ? 'CRIANDO...' : 'FINALIZAR CADASTRO'}
          </button>

          <p onClick={onVoltar} style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px', fontSize: '14px', cursor: 'pointer' }}>Já tem conta? Entrar</p>
        </div>
      </div>
    </>
  )
}

export default Cadastro