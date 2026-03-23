// ... (Mantenha os imports e a lógica do useEffect e salvar do código anterior)

function Perfil({ usuario }) {
  // ... (Mantenha os estados e funções aqui)

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', paddingBottom: '40px' }}>
      
      {/* 1. O BANNER BRASILEIRO (Seu gradiente) */}
      <div style={{
        height: '220px',
        background: 'linear-gradient(135deg, #002776 0%, #009c3b 50%, #ffdf00 100%)',
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        boxShadow: 'inset 0 -15px 15px rgba(0,0,0,0.1)'
      }}>
        
        {/* --- INÍCIO DA ÁREA DO AVATAR ITERATIVO --- */}
        {/* Usamos classes CSS para o efeito de hover funcionar */}
        <div className="avatar-container" style={{
          position: 'absolute', bottom: '-60px',
          width: '120px', height: '120px',
          borderRadius: '50%', background: 'white',
          border: '5px solid white',
          boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
          overflow: 'hidden', // Crucial para o recorte perfeito
          cursor: 'pointer' // Mostra a mãozinha de clique
        }}>
          
          {/* A Foto de Perfil de Fundo */}
          {dadosPerfil.fotoUrl ? (
            <img src={dadosPerfil.fotoUrl} alt="Foto" style={{
                width: '100%', height: '100%',
                objectFit: 'cover', borderRadius: '50%'
              }} 
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              background: '#eee', display: 'flex', 
              alignItems: 'center', justifyContent: 'center',
              fontSize: '60px', color: '#888'
            }}>👤</div>
          )}

          {/* --- A CAMADA DE SOBREPOSIÇÃO (OVERLAY) --- */}
          <div className="avatar-overlay" style={{
            position: 'absolute', top: 0, left: 0,
            width: '100%', height: '100%',
            background: 'rgba(0, 0, 0, 0.7)', // Fundo escuro semitransparente
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            gap: '8px', padding: '10px',
            boxSizing: 'border-box',
            transition: 'opacity 0.3s ease', // Transição suave
            opacity: 0, // Escondido por padrão !!!
            borderRadius: '50%'
          }}>
            
            {/* Ícone de Câmera central */}
            <span style={{ fontSize: '24px', color: 'white' }}>📷</span>
            
            {/* Texto principal */}
            <span style={{ fontSize: '11px', color: 'white', fontWeight: 'bold', textAlign: 'center' }}>
              {dadosPerfil.fotoUrl ? 'ALTERAR FOTO' : 'SUBIR ARQUIVO'}
            </span>

            {/* Sub-menu (aparece apenas se já houver foto) */}
            {dadosPerfil.fotoUrl && (
              <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                <button title="Substituir" style={btnIcone}>🔄</button>
                <button title="Apagar" style={{...btnIcone, background: '#ff4444'}}>🗑️</button>
              </div>
            )}
          </div>
        </div>
        {/* --- FIM DA ÁREA DO AVATAR ITERATIVO --- */}

        {/* Mantenha o botão de Editar no banner */}
        <button onClick={() => setEditando(!editando)} style={btnEditarStyle}>
          {editando ? 'Cancelar' : '✏️ Editar Perfil'}
        </button>
      </div>

      {/* ... Restante do conteúdo (Nome, Bio, Local) abaixo do frame ... */}
      <div style={{ textAlign: 'center', marginTop: '80px', padding: '0 20px' }}>
         {/* ... (Mantenha o código de Nome, Local e Bio aqui) */}
      </div>

      {/* --- CÓDIGO CSS PARA O EFEITO HOVER --- */}
      {/* Como você é autodidata, vai gostar de como resolvemos isso no React */}
      <style>{`
        /* Quando o mouse passar sobre .avatar-container, 
           o .avatar-overlay dentro dele aparece */
        .avatar-container:hover .avatar-overlay {
          opacity: 1 !important;
        }

        /* Efeito visual ao passar o mouse sobre os botões de ação */
        .btn-icone:hover {
          opacity: 0.8;
          transform: scale(1.1);
        }
      `}</style>

    </div>
  )
}

// Estilos extras para o Overlay e Botões
const btnIcone = {
  background: '#ffdf00', color: '#002776', 
  border: 'none', padding: '5px', 
  borderRadius: '5px', cursor: 'pointer',
  fontSize: '12px', className: 'btn-icone',
  transition: 'all 0.2s'
}

const btnEditarStyle = {
  position: 'absolute', right: '20px', bottom: '20px',
  padding: '10px 20px', borderRadius: '25px', border: 'none',
  background: '#ffdf00', color: '#002776', fontWeight: 'bold',
  cursor: 'pointer', fontSize: '14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
}

export default Perfil;