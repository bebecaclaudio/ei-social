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

function Cadastro({ onVoltar }) {
  // 1. ESTADO COMPLETO (Incluindo Estado e País)
  const [form, setForm] = useState({
    nome: '', email: '', senha: '', confirmarSenha: '',
    nascimento: '', telefone: '', cidade: '', estado: '', pais: 'Brasil', sexo: ''
  })
  
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0, respostaUser: '' })
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [termosAceitos, setTermosAceitos] = useState(false)
  
  // Estados de visibilidade da senha
  const [verSenha, setVerSenha] = useState(false)
  const [verConfirmar, setVerConfirmar] = useState(false)
  
  // 2. ESTADO DOS MODAIS (Para leitura dos textos)
  const [modalAberto, setModalAberto] = useState(null) // 'termos' ou 'privacidade' ou null

  useEffect(() => {
    gerarCaptcha()
  }, [])

  const gerarCaptcha = () => {
    setCaptcha({ 
      num1: Math.floor(Math.random() * 9) + 1, 
      num2: Math.floor(Math.random() * 9) + 1, 
      respostaUser: '' 
    })
  }

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value })

  // 3. FUNÇÃO DE CADASTRO REAL
  async function realizarCadastro() {
    setErro('')
    
    if (parseInt(captcha.respostaUser) !== (captcha.num1 + captcha.num2)) {
      setErro('Captcha incorreto!'); gerarCaptcha(); return
    }
    if (!termosAceitos) {
      setErro('Aceite os termos para continuar.'); return
    }
    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem!'); return
    }

    setCarregando(true)
    try {
      const res = await createUserWithEmailAndPassword(auth, form.email, form.senha)
      await updateProfile(res.user, { displayName: form.nome })
      // Aqui você poderia salvar os dados extras (cidade, estado) no Firestore
      console.log("Usuário criado:", res.user.uid)
    } catch (e) {
      setErro('Erro: ' + e.message)
      setCarregando(false)
    }
  }

  return (
    <>
      <style>{`
        input::placeholder { color: rgba(255, 255, 255, 0.4); }
        .grid-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        .senha-container { position: relative; width: 100%; }
        .olhinho { position: absolute; right: 12px; top: 10px; cursor: pointer; font-size: 18px; user-select: none; }
        .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 20px; }
        .modal-content { background: #1a1a1a; padding: 25px; borderRadius: 20px; maxWidth: 500px; color: white; border: 1px solid #ffdf00; }
      `}</style>

      {/* 4. RENDERIZAÇÃO DOS MODAIS */}
      {modalAberto && (
        <div className="modal-overlay" onClick={() => setModalAberto(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ color: '#ffdf00' }}>{modalAberto === 'termos' ? 'Termos de Uso' : 'Política de Privacidade'}</h3>
            <div style={{ maxHeight: '300px', overflowY: 'auto', fontSize: '13px', lineHeight: '1.6', color: '#ccc' }}>
              {modalAberto === 'termos' ? (
                <p>Bem-vinda ao Ei!, Sofia. Ao usar nossa plataforma, você concorda em: 1. Respeitar a comunidade. 2. Não usar bots. 3. Proteger sua conta. Este é um ambiente criativo e seguro.</p>
              ) : (
                <p>Privacidade é prioridade. Coletamos sua localização (Cidade/Estado) apenas para melhorar sua experiência regional. Seus dados não são vendidos.</p>
              )}
            </div>
            <button onClick={() => setModalAberto(null)} style={{ marginTop: '15px', background: '#ffdf00', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>Fechar</button>
          </div>
        </div>
      )}

      <div style={{ minHeight: '100vh', width: '100%', background: 'linear-gradient(160deg, #004d1a 0%, #002776 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', boxSizing: 'border-box' }}>
        <div style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(20px)', borderRadius: '25px', padding: '35px', width: '100%', maxWidth: '440px', textAlign: 'center', border: '1px solid rgba(255,255,255,0.1)' }}>
          <img src="/logo.png" alt="Ei" style={{ height: '50px', marginBottom: '15px' }} />
          <h3 style={{ color: 'white', marginBottom: '20px' }}>Crie sua conta</h3>

          {erro && <p style={{ color: '#ffdf00', fontSize: '13px', marginBottom: '10px' }}>{erro}</p>}

          <input name="nome" placeholder="Nome completo" value={form.nome} onChange={handleChange} style={inputBaseStyle} />
          <input name="email" type="email" placeholder="E-mail" value={form.email} onChange={handleChange} style={inputBaseStyle} />

          <div className="senha-container">
            <input name="senha" type={verSenha ? "text" : "password"} placeholder="Senha" value={form.senha} onChange={handleChange} style={inputBaseStyle} />
            <span className="olhinho" onClick={() => setVerSenha(!verSenha)}>{verSenha ? '👁️' : '🙈'}</span>
          </div>

          <div className="senha-container">
            <input name="confirmarSenha" type={verConfirmar ? "text" : "password"} placeholder="Confirmar Senha" value={form.confirmarSenha} onChange={handleChange} style={inputBaseStyle} />
            <span className="olhinho" onClick={() => setVerConfirmar(!verConfirmar)}>{verConfirmar ? '👁️' : '🙈'}</span>
          </div>

          <div className="grid-campos">
            <input name="cidade" placeholder="Cidade" value={form.cidade} onChange={handleChange} style={inputBaseStyle} />
            <input name="estado" placeholder="Estado" value={form.estado} onChange={handleChange} style={inputBaseStyle} />
            <input name="pais" placeholder="País" value={form.pais} onChange={handleChange} style={inputBaseStyle} />
            <select name="sexo" value={form.sexo} onChange={handleChange} style={inputBaseStyle}>
              <option value="">Sexo</option>
              <option value="M">Masc</option>
              <option value="F">Fem</option>
              <option value="O">Outro</option>
            </select>
          </div>

          <div style={{ textAlign: 'left', marginBottom: '10px' }}>
            <label style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>Nascimento:</label>
            <input name="nascimento" type="date" value={form.nascimento} onChange={handleChange} style={{ ...inputBaseStyle, marginTop: '5px' }} />
          </div>

          <div style={{ background: 'rgba(255,223,0,0.1)', padding: '15px', borderRadius: '12px', marginBottom: '15px' }}>
            <p style={{ color: '#ffdf00', fontSize: '13px', margin: '0 0 10px' }}>Segurança: {captcha.num1} + {captcha.num2} = ?</p>
            <input type="number" placeholder="Resposta" value={captcha.respostaUser} onChange={(e) => setCaptcha({...captcha, respostaUser: e.target.value})} style={{ ...inputBaseStyle, marginBottom: 0, textAlign: 'center' }} />
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '20px', textAlign: 'left' }}>
            <input type="checkbox" checked={termosAceitos} onChange={(e) => setTermosAceitos(e.target.checked)} style={{ accentColor: '#ffdf00', marginTop: '3px' }} />
            <p style={{ color: 'white', fontSize: '11px', margin: 0 }}>
              Aceito os <span onClick={() => setModalAberto('termos')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Termos</span> e a <span onClick={() => setModalAberto('privacidade')} style={{ color: '#ffdf00', cursor: 'pointer', fontWeight: 'bold' }}>Política de Privacidade</span>.
            </p>
          </div>

          <button onClick={realizarCadastro} disabled={carregando} style={{ width: '100%', padding: '16px', borderRadius: '12px', border: 'none', background: '#ffdf00', color: '#002776', fontWeight: '900', cursor: 'pointer' }}>
            {carregando ? 'CRIANDO...' : 'FINALIZAR CADASTRO'}
          </button>
        </div>
      </div>
    </>
  )
}

export default Cadastro