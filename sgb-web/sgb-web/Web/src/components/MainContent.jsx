import { useEffect, useState } from "react";
import LivrosPage from "../pages/Livros/ManterLivros";
import EmprestimosPage from "../pages/Emprestimos/ManterEmprestimo";
import UsuarioPage from "../pages/Usuarios/ManterUsuarios";
import GeneroPage from '../pages/Genero/ManterGenero';

export default function MainContent({ selected, user, onLogout }) {
  const isAdminOrBiblio = user?.perfil === 'ADMIN' || user?.perfil === 'BIBLIOTECARIO';

  return (
    <main className="sgb-main">
      {selected === 'livros' && (
        <LivrosPage user={user} isAdminOrBiblio={isAdminOrBiblio} onLogout={onLogout} />
      )}
      {selected === 'emprestimos' && (
        <EmprestimosPage />
      )}
      {selected === 'usuarios' && <UsuarioPage user={user} />}
      {selected === 'generos' && <GeneroPage user={user} isAdminOrBiblio={isAdminOrBiblio}/>}
      {selected === 'perfil' && (
        <div>
          <h2>Meu Perfil</h2>
          <div className="sgb-user">Usuário: {user.user}</div>
          <div className="sgb-perfil">Perfil: {user.perfil}</div>
          <button className="sgb-logout" onClick={onLogout}>Sair</button>
        </div>
      )}
    </main>
  );
}
