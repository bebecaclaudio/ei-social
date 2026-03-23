import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
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
  transition: 'all 0.2s ease-in-out'
}

function Cadastro() {
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cep: '', cidade: '', estado: '', pais: 'Brasil', sexo: ''
  })

  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, respostaUser: '' })
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [modalAtivo, setModalAtivo] = useState(null)
  const [termosAceitos, setTermosAceitos] = useState(false)
  const [buscandoCep, setBuscandoCep] = useState(false)

  useEffect(() => { gerarCaptcha() }, [])

  function gerarCaptcha() {
    setCaptcha({
      num1: Math.floor(Math.random() * 9) + 1,
      num2: Math.floor(Math.random() * 9) + 1,
      respostaUser: ''
    })
  }

  function calcularIdade(nascimento) {
    const nasc = new Date(nascimento)
    const hoje = new Date()
    const idade = hoje.getFullYear() - nasc.getFullYear()
    const aniversarioPassou = hoje.getMonth() > nasc.getMonth() ||
      (hoje.getMonth() === nasc.getMonth() && hoje.getDate() >= nasc.getDate())
    return aniversarioPassou ? idade : idade - 1
  }

  const handleCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    setForm({ ...form, cep })
    setErro('')

    if (cep.length === 8) {
      setBuscandoCep(true)
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setForm(prev => ({ ...prev, cidade: data.localidade, estado: data.uf, pais: 'Brasil', cep }))
          setSucesso('Endereço encontrado!')
          setTimeout(() => setSucesso(''), 2000)
        } else {
          setErro('CEP não encontrado.')
        }
      } catch {
        setErro('Erro ao buscar endereço.')
      } finally {
        setBuscandoCep(false)
      }
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
    setErro('')
  }

  async function realizarCadastro() {
    setErro('')

    if (!form.nome.trim()) { setErro('Informe seu nome completo.'); return }
    if (!form.email.trim()) { setErro('Informe seu e-mail.'); return }
    if (!form.senha) { setErro('Crie uma senha.'); return }
    if (form.senha.length < 6) { setErro('Senha muito fraca (mín. 6 caracteres).'); return }
    if (form.senha !== form.confirmarSenha) { setErro('As senhas não coincidem!'); return }
    if (!form.nascimento) { setErro('Informe sua data de nascimento.'); return }
    if (calcularIdade(form.nascimento) < 16) { setErro('Você precisa ter pelo menos 16 anos para se cadastrar.'); return }
    if (!form.cidade.trim()) { setErro('Informe sua cidade.'); return }
    if (!form.sexo) { setErro('Selecione seu sexo.'); return }
    if (parseInt(captcha.respostaUser) !== (captcha.num1 + captcha.num2)) {
      setErro('Resultado do Captcha incorreto!'); gerarCaptcha(); return
    }
    if (!termosAceitos) { setErro('Você precisa aceitar os termos.'); return }

    setCarregando(true)
    try {
      const res = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(res.user, { displayName: form.nome })
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setErro('E-mail já cadastrado.')
      else if (err.code === 'auth/weak-password') setErro('Senha muito fraca (mín. 6 caracteres).')
      else if (err.code === 'auth/invalid-email') setErro('E-mail inválido.')
      else setErro('Erro ao criar conta. Tente novamente.')
      setCarregando(false)
      gerarCaptcha()
    }
  }

  const senhasCoincidem = form.confirmarSenha && form.senha === form.confirmarSenha
  const senhasNaoCoincidem = form.confirmarSenha && form.senha !== form.confirmarSenha

  return (
    <>
      <style>{`
        input::placeholder { color: rgba(255, 255, 255, 0.4); }
        select option { background: #1a1a1a; color: white; }
        .grid-local { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .senha-box { position: relative; width: 100%; }
        .olhinho-btn { position: absolute; right: 12px; top: 10px; cursor: pointer; font-size: 18px; user-select: none; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999; display: flex; align-items: center; justify-content: center; padding: 20px; box-sizing: border-box; }
      `}</style>

      {/* MODAIS */}
      {modalAtivo && (
        <div className="modal-overlay" onClick={() => setModalAtivo(null)}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '20px', maxWidth: '450px', width: '100%', border: '1px solid #ffdf00' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ffdf00', marginTop: 0 }}>
              {modalAtivo === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}
            </h3>
            <div style={{ color: '#ccc', fontSize: '13px', maxHeight: '250px', overflowY: 'auto', textAlign: 'left', lineHeight: '1.8' }}>
              {modalAtivo === 'termos' ? (
                <>
                  <p><strong style={{color:'#ffdf00'}}>1. Uso da plataforma</strong><br/>Ao se cadastrar, você concorda em usar o Ei! para fins lícitos, respeitando outros usuários e a comunidade brasileira.</p>
                  <p><strong style={{color:'#ffdf00'}}>2. Responsabilidade</strong><br/>Você é responsável pelo conteúdo que publica. Conteúdos ofensivos, ilegais ou que violem direitos de terceiros serão removidos.</p>
                  <p><strong style={{color:'#ffdf00'}}>3. Idade mínima</strong><br/>É necessário ter pelo menos 16 anos para criar uma conta.</p>
                  <p><strong style={{color:'#ffdf00'}}>4. Segurança</strong><br/>Mantenha sua senha em sigilo. O Ei! nunca pedirá sua senha por e-mail ou mensagem.</p>
                </>
              ) : (
                <>
                  <p><strong style={{color:'#ffdf00'}}>1. Dados coletados</strong><br/>Coletamos nome, e-mail, cidade e data de nascimento para personalizar sua experiência.</p>
                  <p><strong style={{color:'#ffdf00'}}>2. Uso dos dados</strong><br/>Seus dados de localização são usados para conectar você a conteúdos e comunidades regionais.</p>
                  <p><strong style={{color:'#ffdf00'}}>3. Compartilhamento</strong><br/>Não compartilhamos seus dados pessoais com terceiros sem seu consentimento.</p>
                  <p><strong style={{color:'#ffdf00'}}>4. Segurança</strong><br/>Suas senhas são armazenadas de forma criptografada. Nunca temos acesso a elas.</p>
                </>
              )}
            </div>
            <button onClick={() => setModalAtivo(null)} style={{ background: '#ffdf00', border: 'none', padding: '12px', borderRadius: '10px', width: '100%', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer', color: '#002776' }}>
              Fechar
            </button>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', borderRadius: '25px', padding: '35px', width: '100%', maxWidth: '440px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          
          <img src="/logo.png" alt="Ei" style={{ height: '60px', marginBottom: '8px' }} />
          <h3 style={{ color: 'white', marginBottom: '20px', fontWeight: '700' }}>Nova Conta</h3>

          {erro && (
            <div style={{ color: '#ffdf00', fontSize: '13px', background: 'rgba(255,100,100,0.15)', border: '1px solid rgba(255,100,100,0.3)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              ⚠️ {erro}
            </div>
          )}

          {sucesso && (
            <div style={{ color: '#00ff88', fontSize: '13px', background: 'rgba(0,200,100,0.15)', border: '1px solid rgba(0,200,100,0.3)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>
              ✅ {sucesso}
            </div>
          )}

          <input name="nome" placeholder="Nome completo *" onChange={handleChange} style={inputBaseStyle} />
          <input name="email" type="email" placeholder="E-mail *" onChange={handleChange} style={inputBaseStyle} />

          <div className="senha-box">
            <input name="senha" type={verSenha ? 'text' : 'password'} placeholder="Senha * (mín. 6 caracteres)" onChange={handleChange} style={inputBaseStyle} />
            <span className="olhinho-btn" onClick={() => setVerSenha(!verSenha)}>{verSenha ? '👁️' : '🙈'}</span>
          </div>

          <div className="senha-box">
            <input name="confirmarSenha" type={verConfirmar ? 'text' : 'password'} placeholder="Confirme a Senha *" onChange={handleChange}
              style={{
                ...inputBaseStyle,
                border: senhasCoincidem ? '1px solid #00ff88' : senhasNaoCoincidem ? '1px solid #ff4444' : '1px solid rgba(255,255,255,0.15)'
              }}
            />
            <span className="olhinho-btn" onClick={() => setVerConfirmar(!verConfirmar)}>{verConfirmar ? '👁️' : '🙈'}</span>
          </div>
          {senhasCoincidem && <p style={{ color: '#00ff88', fontSize: '11px', marginTop: '-6px', marginBottom: '8px', textAlign: 'left' }}>✅ Senhas coincidem!</p>}
          {senhasNaoCoincidem && <p style={{ color: '#ff4444', fontSize: '11px', marginTop: '-6px', marginBottom: '8px', textAlign: 'left' }}>❌ Senhas não coincidem!</p>}

          <input name="telefone" type="tel" placeholder="Telefone (opcional)" onChange={handleChange} style={inputBaseStyle} />

          <div style={{ position: 'relative' }}>
            <input name="cep" placeholder="CEP (auto-completa cidade e estado)" maxLength="8" onChange={handleCep}
              style={{ ...inputBaseStyle, border: '1px solid #ffdf00', paddingRight: buscandoCep ? '40px' : '15px' }}
            />
            {buscandoCep && <span style={{ position: 'absolute', right: '12px', top: '10px', fontSize: '16px' }}>⏳</span>}
          </div>

          <div className="grid-local">
            <input name="cidade" placeholder="Cidade *" value={form.cidade} onChange={handleChange} style={inputBaseStyle} />
            <input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} style={inputBaseStyle} />
          </div>

          <div className="grid-local">
            <input name="pais" placeholder="País" value={form.pais} onChange={handleChange} style={inputBaseStyle} />
            <select name="sexo" value={form.sexo} onChange={handleChange} style={inputBaseStyle}>
              <option value="" disabled>Sexo *</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
              <option value="Privado">Prefiro não dizer</option>
            </select>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '5px' }}>
              Data de nascimento * (mínimo 16 anos)
            </label>
            <input name="nascimento" type="date" onChange={handleChange} style={{ ...inputBaseStyle, marginTop: '5px' }} />
          </div>

          <div style={{ background: 'rgba(255,223,0,0.08)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed rgba(255,223,0,0.3)' }}>
            <p style={{ color: '#ffdf00', fontSize: '13px', margin: '0 0 10px', fontWeight: 'bold' }}>
              🔒 Segurança: {captcha.num1} + {captcha.num2} = ?
            </p>
            <input type="number" placeholder="Sua resposta" value={captcha.respostaUser}
              onChange={(e) => setCaptcha({ ...captcha, respostaUser: e.target.value })}
              style={{ ...inputBaseStyle, marginBottom: 0, textAlign: 'center' }}
            />
            <span onClick={gerarCaptcha} style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', cursor: 'pointer', marginTop: '6px', display: 'block' }}>
              🔄 Gerar novo captcha
            </span>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px', textAlign: 'left' }}>
            <input type="checkbox" checked={termosAceitos} onChange={(e) => setTermosAceitos(e.target.checked)} style={{ accentColor: '#ffdf00', marginTop: '3px', cursor: 'pointer' }} />
            <p style={{ color: 'white', fontSize: '11px', margin: 0, lineHeight: '1.6' }}>
              Eu li e aceito os{' '}
              <span onClick={() => setModalAtivo('termos')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Termos de Uso</span>
              {' '}e as{' '}
              <span onClick={() => setModalAtivo('privacidade')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Políticas de Privacidade</span>.
            </p>
          </div>

          <button onClick={realizarCadastro} disabled={carregando} style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: carregando ? '#ccc' : '#ffdf00', color: '#002776',
            fontWeight: '900', fontSize: '16px', cursor: carregando ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s'
          }}>
            {carregando ? '⏳ CRIANDO CONTA...' : 'FINALIZAR CADASTRO'}
          </button>

          <p onClick={() => navigate('/')} style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px', fontSize: '14px', cursor: 'pointer' }}>
            Já tem conta?{' '}
            <span style={{ color: '#ffdf00', fontWeight: 'bold' }}>Entrar</span>
          </p>
        </div>
      </div>
    </>
  )
}

export default Cadastro