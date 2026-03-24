import React from 'react'

// --- ESTILO BASE (Compartilhado pelas duas) ---
const estiloBase = {
  width: '280px',
  minWidth: '280px',
  display: 'flex',
  flexDirection: 'column',
  gap: '20px',
  padding: '10px',
  position: 'sticky',
  top: '80px', // Ajuste para ficar abaixo do seu Header fixo
  height: 'calc(100vh - 100px)',
  overflowY: 'auto',
  scrollbarWidth: 'none', // Esconde o scroll no Firefox para ficar mais limpo
};

// --- COMPONENTE: SIDEBAR DA ESQUERDA ---
// Ideal para: Perfil, Menu de Navegação, Sobre a Comunidade
export function SidebarEsquerda({ children }) {
  return (
    <aside id="sidebar-esquerda" style={estiloBase}>
      {children}
    </aside>
  );
}

// --- COMPONENTE: SIDEBAR DA DIREITA ---
// Ideal para: Membros (rostinhos), Sugestões, Widgets de Projetos
export function SidebarDireita({ children }) {
  return (
    <aside id="sidebar-direita" style={estiloBase}>
      {children}
    </aside>
  );
}

// --- ESTILO DE CARD (Para você usar dentro das sidebars) ---
export const cardEstilo = {
  background: 'white',
  padding: '15px',
  borderRadius: '15px',
  boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
  border: '1px solid #f0f0f0'
};