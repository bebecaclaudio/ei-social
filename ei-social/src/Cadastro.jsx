import { useState, useEffect } from 'react'
import { auth } from './firebase-config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

// Estilo dos inputs com foco no contraste para leitura
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

// Componente de Modal para leitura de Termos/Políticas
const ModalPrivacidade = ({ titulo, conteudo, fechar }) => (
  <div style={{
    position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '20px'
  }}>
    <div style={{
      background: '#1a1a1a', padding: '25px', borderRadius: '20px', maxWidth: '500px', 
      width: '100%', color: 'white', maxHeight: '80vh', overflowY: 'auto', border: '1px solid #ffdf00'
    }}>
      <h3 style={{ color: '#ffdf00', marginTop: 0 }}>{titulo}</h3>
      <p style={{ fontSize: '14px', lineHeight: '1.6', color: '#ccc' }}>{conteudo}</p>
      <button onClick={fechar} style={{
        width: '100%', padding: '10px', borderRadius: '10px', border: 'none',
        background: '#ffdf00', color: '#002776', fontWeight: 'bold', cursor: 'pointer', marginTop: '15px'
      }}>Entendi</button>
    </div>
  </div>
);

function Cadastro({ onVoltar }) {
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cidade: '', estado: '', pais: 'Brasil', sexo: ''
  })
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, respostaUser: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [focado, setFocado] = useState('')
  const [termos, setTermos] = useState(false)
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [modalAtivo, setModalAtivo] = useState(null)

  useEffect(() => { gerarCaptcha() }, [])

  const gerarCaptcha = () => {
    setCaptcha({ num1: Math.floor(Math.random() * 9) + 1, num2: Math.floor(Math.random() * 9) + 1, respostaUser: '' })
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  async function cadastrar() {
    setErro('')
    if (parseInt(captcha.respostaUser) !== (captcha.num1 + captcha.num2)) {
      setErro('Resultado do captcha incorreto!')
      gerarCaptcha()
      return
    }
    if (!form.nome || !form.email || !form.senha || !form.confirmarSenha || !form.nascimento || !form.cidade || !form.estado || !form.pais || !form.sexo) {
      setErro('Preencha todos os campos obrigatórios!')
      return
    }
    setCarregando(true)
    try {
      const resultado = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(resultado.user, { displayName: form.nome })
    } catch (e) {
      setErro('Erro no cadastro. Tente novamente.')
      setCarregando(false)
      gerarCaptcha()
    }
  }

  return (
    <>
      <style>{`
        input:-webkit-autofill { -webkit-text-fill-color: #ffffff !important; -webkit-box-shadow: 0 0 0px 1000px rgba(10, 30, 10, 0.9) inset !important; }
        input::placeholder { color: rgba(255, 255, 255, 0.5) !important; }
      `}</style>

      {modalAtivo && (
        <ModalPrivacidade 
          titulo={modalAtivo === 'termos' ? "Termos de Uso" : "Política de Privacidade"}
          fechar={() => setModalAtivo(null)}
          conteudo={modalAtivo === 'termos' ? "Ao usar o Ei, você concorda em respeitar outros usuários e não publicar conteúdo ilegal..." : "Seus dados são protegidos e usados apenas para a experiência na rede social..."}
        />
      )}

      <div style={{
        minHeight: '100vh', width: '100vw', background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box'
      }}>
        <div style={{
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(25px)', borderRadius: '24px',
          padding: '30px', width: '100%', maxWidth: '450px', textAlign: 'center',
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.12)'
        }}>
          <img src="/logo.png" alt="Ei" style={{ height: '50px', marginBottom: '15px' }} />
          <p style={{ color: 'white', fontWeight: '600', marginBottom: '20px' }}>Nova Conta</p>

          {erro && <p style={{ color: '#ffdf00', fontSize: '13px', marginBottom: '15px' }}>{erro}</p>}

          <input name="nome" placeholder={focado==='nome'?'':"Nome Completo"} onFocus={()=>setFocado('nome')} onBlur={()=>setFocado('')} value={form.nome} onChange={handleChange} style={getInputStyle(focado==='nome')} />
          <input name="email" placeholder={focado==='email'?'':"E-mail"} onFocus={()=>setFocado('email')} onBlur={()=>setFocado('')} value={form.email} onChange={handleChange} style={getInputStyle(focado==='email')} />

          <div style={{ position: 'relative' }}>
            <input name="senha" type={mostrarSenha ? "text" : "password"} placeholder="Senha" value={form.senha} onChange={handleChange} style={getInputStyle(false)} />
            <span onClick={() => setMostrarSenha(!mostrarSenha)} style={{ position: 'absolute', right: '12px', top: '10px', cursor: 'pointer' }}>{mostrarSenha?'👁️':'🙈'}</span>
          </div>

          <input name="confirmarSenha" type={mostrarSenha ? "text" : "password"} placeholder="Confirmar Senha" value={form.confirmarSenha} onChange={handleChange} style={getInputStyle(false, form.confirmarSenha && form.senha !== form.confirmarSenha)} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} style={getInputStyle(false)} />
            <input name="estado" placeholder="Estado (Ex: SP)" value={form.estado} onChange={handleChange} style={getInputStyle(false)} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            <input name="pais" placeholder="País" value={form.pais} onChange={handleChange} style={getInputStyle(false)} />
            <select name="sexo" value={form.sexo} onChange={handleChange} style={{ ...getInputStyle(false), color: form.sexo===''?'rgba(255,255,255,0.5)':'white' }}>
              <option value="" disabled>Sexo</option>
              <option value="masculino">Masculino</option>
              <option value="feminino">Feminino</option>
              <option value="outro">Outro</option>
            </select>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Nascimento:</label>
            <input name="nascimento" type="date" value={form.nascimento} onChange={handleChange} style={getInputStyle(false)} />
          </div>

          <div style={{ background: 'rgba(255,223,0,0.1)', padding: '10px', borderRadius: '10px', marginBottom: '15px' }}>
            <p style={{ color: '#ffdf00', fontSize: '13px', margin: '0 0 5px' }}>Captcha: {captcha.num1} + {captcha.num2} = ?</p>
            <input type="number" value={captcha.respostaUser} onChange={(e)=>setCaptcha({...captcha, respostaUser: e.target.value})} style={{ ...getInputStyle(false), marginBottom: 0, textAlign: 'center' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '15px', textAlign: 'left' }}>
            <input type="checkbox" checked={termos} onChange={(e)=>setTermos(e.target.checked)} style={{ accentColor: '#ffdf00' }} />
            <p style={{ color: 'white', fontSize: '11px', margin: 0 }}>
              Aceito os <span onClick={()=>setModalAtivo('termos')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Termos</span> e <span onClick={()=>setModalAtivo('privacidade')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Privacidade</span>.
            </p>
          </div>

          <button onClick={cadastrar} disabled={carregando} style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#ffdf00', color: '#002776', fontWeight: '800', cursor: 'pointer' }}>
            {carregando ? 'PROCESSANDO...' : 'FINALIZAR CADASTRO'}
          </button>
        </div>
      </div>
    </>
  )
}

export default Cadastro