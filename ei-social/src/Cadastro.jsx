import { useState, useEffect } from 'react'
import { auth } from './firebase-config'
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth'

// Estilo Base para manter o Glassmorphism
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

function Cadastro({ onVoltar }) {
  // 1. ESTADO COMPLETO DO FORMULÁRIO
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cep: '', cidade: '', estado: '', pais: 'Brasil', sexo: ''
  })
  
  // 2. ESTADOS DE INTERFACE E SEGURANÇA
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, respostaUser: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  const [modalAtivo, setModalAtivo] = useState(null)
  const [termosAceitos, setTermosAceitos] = useState(false)

  // Inicializa o Captcha
  useEffect(() => { gerarCaptcha() }, [])

  function gerarCaptcha() {
    setCaptcha({ 
      num1: Math.floor(Math.random() * 9) + 1, 
      num2: Math.floor(Math.random() * 9) + 1, 
      respostaUser: '' 
    })
  }

  // 3. LÓGICA DE AUTOCOMPLETAR CEP (ViaCEP)
  const handleCep = async (e) => {
    const cep = e.target.value.replace(/\D/g, '')
    setForm({ ...form, cep: cep })
    
    if (cep.length === 8) {
      try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
        const data = await response.json()
        if (!data.erro) {
          setForm(prev => ({
            ...prev,
            cidade: data.localidade,
            estado: data.uf,
            pais: 'Brasil',
            cep: cep
          }))
        } else {
          setErro('CEP não encontrado.')
        }
      } catch (err) {
        setErro('Erro ao buscar endereço.')
      }
    }
  }

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  // 4. FUNÇÃO DE CADASTRO NO FIREBASE
  async function realizarCadastro(e) {
    e.preventDefault()
    setErro('')

    // Validações de Segurança
    if (parseInt(captcha.respostaUser) !== (captcha.num1 + captcha.num2)) {
      setErro('Resultado do Captcha incorreto!'); gerarCaptcha(); return
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem!'); return
    }
    if (!termosAceitos) {
      setErro('Você precisa aceitar os termos.'); return
    }

    setCarregando(true)
    try {
      const res = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(res.user, { displayName: form.nome })
      console.log("Sucesso:", res.user.uid)
      // Aqui o Firebase já loga o usuário automaticamente
    } catch (err) {
      if (err.code === 'auth/email-already-in-use') setErro('E-mail já cadastrado.')
      else if (err.code === 'auth/weak-password') setErro('Senha muito fraca (mín. 6 caracteres).')
      else setErro('Erro ao criar conta. Tente novamente.')
      setCarregando(false)
      gerarCaptcha()
    }
  }

  return (
    <>
      <style>{`
        input::placeholder { color: rgba(255, 255, 255, 0.4); }
        select option { background: #1a1a1a; color: white; }
        .grid-local { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .senha-box { position: relative; width: 100%; }
        .olhinho-btn { position: absolute; right: 12px; top: 10px; cursor: pointer; font-size: 18px; user-select: none; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.85); z-index: 999; display: flex; align-items: center; justifyContent: center; padding: 20px; }
      `}</style>

      {/* MODAIS DE TERMOS E PRIVACIDADE */}
      {modalAtivo && (
        <div className="modal-overlay" onClick={() => setModalAtivo(null)}>
          <div style={{ background: '#111', padding: '30px', borderRadius: '20px', maxWidth: '450px', border: '1px solid #ffdf00' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ffdf00', marginTop: 0 }}>{modalAtivo === 'termos' ? 'Termos de Uso' : 'Privacidade'}</h3>
            <div style={{ color: '#ccc', fontSize: '13px', maxHeight: '250px', overflowY: 'auto', textAlign: 'left', lineHeight: '1.6' }}>
              {modalAtivo === 'termos' ? (
                <p>Bem-vinda ao Ei!, Sofia. Ao se cadastrar, você concorda em usar a plataforma para fins lícitos, respeitando a comunidade e protegendo sua senha pessoal.</p>
              ) : (
                <p>Nós valorizamos sua privacidade. Seus dados de localização (Cidade/Estado) são usados para conectar você a conteúdos regionais. Não compartilhamos suas senhas.</p>
              )}
            </div>
            <button onClick={() => setModalAtivo(null)} style={{ background: '#ffdf00', border: 'none', padding: '12px', borderRadius: '10px', width: '100%', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>Fechar</button>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', borderRadius: '25px', padding: '35px', width: '100%', maxWidth: '440px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/logo.png" alt="Ei" style={{ height: '50px', marginBottom: '15px' }} />
          <h3 style={{ color: 'white', marginBottom: '20px' }}>Nova Conta</h3>

          {erro && <p style={{ color: '#ffdf00', fontSize: '13px', background: 'rgba(255,223,0,0.1)', padding: '10px', borderRadius: '8px', marginBottom: '15px' }}>{erro}</p>}

          <input name="nome" placeholder="Nome completo" onChange={handleChange} style={inputBaseStyle} />
          <input name="email" type="email" placeholder="E-mail" onChange={handleChange} style={inputBaseStyle} />

          {/* SENHA 1 COM OLHINHO */}
          <div className="senha-box">
            <input name="senha" type={verSenha ? "text" : "password"} placeholder="Senha" onChange={handleChange} style={inputBaseStyle} />
            <span className="olhinho-btn" onClick={() => setVerSenha(!verSenha)}>{verSenha ? '👁️' : '🙈'}</span>
          </div>

          {/* SENHA 2 COM OLHINHO */}
          <div className="senha-box">
            <input name="confirmarSenha" type={verConfirmar ? "text" : "password"} placeholder="Confirme a Senha" onChange={handleChange} style={inputBaseStyle} />
            <span className="olhinho-btn" onClick={() => setVerConfirmar(!verConfirmar)}>{verConfirmar ? '👁️' : '🙈'}</span>
          </div>

          {/* LOCALIZAÇÃO AUTOMÁTICA */}
          <input name="cep" placeholder="CEP (Auto-completa)" maxLength="8" onChange={handleCep} style={{ ...inputBaseStyle, border: '1px solid #ffdf00' }} />

          <div className="grid-local">
            <input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} style={inputBaseStyle} />
            <input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} style={inputBaseStyle} />
          </div>

          <div className="grid-local">
            <input name="pais" placeholder="País" value={form.pais} onChange={handleChange} style={inputBaseStyle} />
            <select name="sexo" value={form.sexo} onChange={handleChange} style={inputBaseStyle}>
              <option value="" disabled>Sexo</option>
              <option value="Feminino">Feminino</option>
              <option value="Masculino">Masculino</option>
              <option value="Outro">Outro</option>
              <option value="Privado">Não dizer</option>
            </select>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px', marginLeft: '5px' }}>Nascimento:</label>
            <input name="nascimento" type="date" onChange={handleChange} style={{ ...inputBaseStyle, marginTop: '5px' }} />
          </div>

          {/* CAPTCHA DE SEGURANÇA */}
          <div style={{ background: 'rgba(255,223,0,0.08)', padding: '15px', borderRadius: '12px', marginBottom: '20px', border: '1px dashed rgba(255,223,0,0.3)' }}>
            <p style={{ color: '#ffdf00', fontSize: '13px', margin: '0 0 10px', fontWeight: 'bold' }}>Segurança: {captcha.num1} + {captcha.num2} = ?</p>
            <input type="number" placeholder="Sua resposta" value={captcha.respostaUser} onChange={(e) => setCaptcha({...captcha, respostaUser: e.target.value})} style={{ ...inputBaseStyle, marginBottom: 0, textAlign: 'center' }} />
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', marginBottom: '20px', textAlign: 'left' }}>
            <input type="checkbox" checked={termosAceitos} onChange={(e) => setTermosAceitos(e.target.checked)} style={{ accentColor: '#ffdf00', marginTop: '3px' }} />
            <p style={{ color: 'white', fontSize: '11px', margin: 0 }}>
              Eu li e aceito os <span onClick={() => setModalAtivo('termos')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Termos</span> e as <span onClick={() => setModalAtivo('privacidade')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Políticas de Privacidade</span>.
            </p>
          </div>

          <button onClick={realizarCadastro} disabled={carregando} style={{
            width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
            background: '#ffdf00', color: '#002776', fontWeight: '900', fontSize: '16px', cursor: 'pointer'
          }}>
            {carregando ? 'CRIANDO CONTA...' : 'FINALIZAR CADASTRO'}
          </button>

          <p onClick={onVoltar} style={{ color: 'rgba(255,255,255,0.6)', marginTop: '20px', fontSize: '14px', cursor: 'pointer' }}>Já tem conta? <span style={{ color: '#ffdf00' }}>Entrar</span></p>
        </div>
      </div>
    </>
  )
}

export default Cadastro