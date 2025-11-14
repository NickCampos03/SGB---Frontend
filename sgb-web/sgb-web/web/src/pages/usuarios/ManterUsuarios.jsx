import { useEffect, useState } from 'react';

const PERFIS = [
  { value: '', label: 'Todos' },
  { value: 'USUARIO', label: 'Usuário' },
  { value: 'ADMIN', label: 'Administrador' },
  { value: 'BIBLIOTECARIO', label: 'Bibliotecário' },
];

export default function UsuarioPage({ user }) {
  const [usuarios, setUsuarios] = useState([]);
  const [todosUsuarios, setTodosUsuarios] = useState([]);
  const [filtros, setFiltros] = useState({ nomeUsuario: '' });
  const [filtroPerfil, setFiltroPerfil] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(null);
  const [reload, setReload] = useState(false);
  const isAdmin = user?.perfil === 'ADMIN';
  const isBiblio = user?.perfil === 'BIBLIOTECARIO';
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    let url = '/usuarios';
    if (filtroPerfil) url += `?perfil=${filtroPerfil}`;

    fetch(url, {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        if (!res.ok) throw new Error('Erro ao buscar usuários');
        return res.json();
      })
    .then(data => {
      let lista = Array.isArray(data) ? data : [];

      if (isBiblio) {
        lista = lista.filter(u => u.perfil !== 'ADMIN');
      }
      lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt', { sensitivity: 'base' }));

      setUsuarios(lista);
      setTodosUsuarios(lista);
    })
      .catch(() => setError('Erro ao buscar usuários.'))
      .finally(() => setLoading(false));
  }, [filtroPerfil, reload, isBiblio]);

  useEffect(() => {
    let filtrados = [...todosUsuarios];
    if (filtros.nomeUsuario) {
      filtrados = filtrados.filter(u =>
        u.nome?.toLowerCase().includes(filtros.nomeUsuario.toLowerCase())
      );
    }
    setUsuarios(filtrados);
  }, [filtros, todosUsuarios]);

  function handleFiltroChange(e) {
    const { name, value } = e.target;
    setFiltros(f => ({ ...f, [name]: value }));
  }

  function handlePerfilChange(e) {
    setFiltroPerfil(e.target.value);
  }

  function handleCardClick(usuario) {
    setShowModal(usuario);
  }

  function handleCloseModal(atualizou) {
    setShowModal(null);
    if (atualizou) setReload(r => !r);
  }

  return (
    <>
      <h2>Usuários</h2>
      <div
        className="sgb-livros-filtros"
        style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}
      >
        <button
          className="sgb-btn-criar-livro"
          type="button"
          style={{ marginRight: 8 }}
          onClick={() => setShowCreate(true)}
        >
          + Novo
        </button>
        <input
          name="nomeUsuario"
          placeholder="Filtrar por usuário"
          value={filtros.nomeUsuario}
          onChange={handleFiltroChange}
        />
        <select name="perfil" value={filtroPerfil} onChange={handlePerfilChange} style={{ minWidth: 180 }}>
          {PERFIS.map(p => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="sgb-error">{error}</p>}
      <div className="sgb-emprestimos-list">
        {usuarios.map(u => (
          <UsuarioCard key={u.codigoLogin} usuario={u} onClick={() => handleCardClick(u)} />
        ))}
        {!loading && usuarios.length === 0 && !error && <p>Nenhum usuário encontrado.</p>}
      </div>
      {showModal && (
        <UsuarioModal usuario={showModal} onClose={handleCloseModal} perfilLogado={user?.perfil} />
      )}
      {showCreate && (
        <CriarUsuarioModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            setReload(r => !r);
          }}
          isAdmin={isAdmin}
          isBiblio={isBiblio}
        />
      )}
    </>
  );
}

function UsuarioCard({ usuario, onClick }) {
  return (
    <div
      className="sgb-emprestimo-card sgb-emprestimo-card-clickable"
      onClick={onClick}
      tabIndex={0}
      style={{ cursor: 'pointer' }}
    >
      <div>
        <div className="sgb-emprestimo-codigo" style={{ marginBottom: '0.5rem' }}>
          Usuário #{usuario.codigoLogin}
        </div>
        <div><b>Nome:</b> {usuario.nome}</div>
        <div><b>Email:</b> <br></br> {usuario.email}</div>
        <div><b>Telefone:</b> {usuario.telefone}</div>
        <div><b>Data de Nascimento:</b><br></br>{usuario.dataDeNascimento}</div>
        <div><b>Perfil:</b> {usuario.perfil}</div>
      </div>
    </div>
  );
}

function UsuarioModal({ usuario, onClose, perfilLogado }) {
  const [editMode, setEditMode] = useState(false);
  const [form, setForm] = useState({ ...usuario });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [atualizou, setAtualizou] = useState(false);
  const isAdmin = perfilLogado === 'ADMIN';
  const isBiblio = perfilLogado === 'BIBLIOTECARIO';

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleEditar() {
    setEditMode(true);
  }

  function handleSalvar(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    fetch(`/usuarios/${usuario.codigoLogin}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        dataDeNascimento: form.dataDeNascimento,
        perfil: form.perfil,
      }),
    })
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(() => {
        setSuccess('Usuário atualizado com sucesso!');
        setEditMode(false);
        setAtualizou(true);
      })
      .catch(() => setError('Erro ao atualizar usuário.'))
      .finally(() => setLoading(false));
  }

  function handleExcluir() {
    if (!window.confirm('Tem certeza que deseja excluir este usuário?')) return;
    setLoading(true);
    fetch(`/usuarios/${usuario.codigoLogin}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        if (res.ok) {
          setSuccess('Usuário excluído com sucesso!');
          setAtualizou(true);
          setTimeout(() => onClose(true), 1000);
        } else {
          return res.text().then(text => {
            setError('Erro ao excluir usuário. ' + text);
          });
        }
      })
      .catch(() => setError('Erro ao excluir usuário.'))
      .finally(() => setLoading(false));
  }

  function handleClose() {
    onClose(atualizou);
  }

  const podeEditar = isAdmin || (isBiblio && usuario.perfil === 'USUARIO');
  const podeExcluir = isAdmin || (isBiblio && usuario.perfil === 'USUARIO');

  return (
    <div className="sgb-modal-bg">
      <form className="sgb-modal-form" onSubmit={handleSalvar}>
        <button className="sgb-modal-close-x" onClick={handleClose} type="button" title="Fechar">×</button>
        <h3>Usuário #{usuario.codigoLogin}</h3>

        <label>Nome</label>
        <input type="text" name="nome" value={form.nome} onChange={handleChange} disabled={!editMode} />

        <label>Email</label>
        <input type="email" name="email" value={form.email} onChange={handleChange} disabled={!editMode} />

        <label>Telefone</label>
        <input type="text" name="telefone" value={form.telefone} onChange={handleChange} disabled={!editMode} />

        <label>Data de Nascimento</label>
        <input
          type="date"
          name="dataDeNascimento"
          value={form.dataDeNascimento ? form.dataDeNascimento.split('T')[0] : ''}
          onChange={handleChange}
          disabled={!editMode}
        />

        <label>Perfil</label>
        {isAdmin ? (
          <select
            name="perfil"
            value={form.perfil}
            onChange={handleChange}
            disabled={!editMode}
          >
            <option value="">Selecione o perfil</option>
            <option value="USUARIO">USUARIO</option>
            <option value="ADMIN">ADMIN</option>
            <option value="BIBLIOTECARIO">BIBLIOTECARIO</option>
          </select>
        ) : (
          <input
            type="text"
            name="perfil"
            value={form.perfil}
            disabled
          />
        )}
        {error && <div className="sgb-error">{error}</div>}
        {success && <div className="sgb-success">{success}</div>}

        <div className="sgb-modal-actions">
          {!editMode && podeEditar && (
            <button type="button" className="sgb-btn-editar" onClick={handleEditar}>
              Editar
            </button>
          )}

          {editMode && (
            <button type="submit" className="sgb-btn-salvar" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          )}

          {podeExcluir && (
            <button
              type="button"
              className="sgb-btn-excluir"
              onClick={handleExcluir}
              disabled={loading}
            >
              {loading ? 'Excluindo...' : 'Excluir'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function CriarUsuarioModal({ onClose, onCreated, isAdmin, isBiblio }) {
  const [form, setForm] = useState({
    nome: '',
    email: '',
    telefone: '',
    dataDeNascimento: '',
    perfil: isBiblio ? 'USUARIO' : '',
    senha: '',
    senha2: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.nome || !form.email || !form.telefone || !form.dataDeNascimento || !form.senha || !form.senha2) {
      setError('Preencha todos os campos.');
      return;
    }
    if (form.senha !== form.senha2) {
      setError('As senhas não coincidem.');
      return;
    }
    setLoading(true);
    fetch('/usuarios', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        dataDeNascimento: form.dataDeNascimento,
        perfil: isBiblio ? 'USUARIO' : form.perfil,
        senha: form.senha,
      }),
    })
      .then(res => (res.ok ? res.json() : Promise.reject(res)))
      .then(() => {
        onCreated();
      })
      .catch(() => setError('Erro ao criar usuário.'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="sgb-modal-bg">
      <form className="sgb-modal-form" onSubmit={handleSubmit}>
        <button className="sgb-modal-close-x" onClick={onClose} type="button" title="Fechar">×</button>
        <h3>Novo Usuário</h3>

        <input type="text" name="nome" placeholder="Nome" value={form.nome} onChange={handleChange} required />
        <input type="email" name="email" placeholder="Email" value={form.email} onChange={handleChange} required />
        <input type="text" name="telefone" placeholder="Telefone" value={form.telefone} onChange={handleChange} maxLength="11" required minLength= "11"/>
        <input type={form.showDate ? "date" : "text"}
          name="dataDeNascimento"
          placeholder="Data de nascimento"
          value={form.dataDeNascimento}
          onFocus={(e) => e.target.type = "date"}
          onBlur={(e) => {
            if (!e.target.value) e.target.type = "text";
          }}
          onChange={handleChange}
          required/>

        {isAdmin ? (
          <select name="perfil" value={form.perfil} onChange={handleChange} required>
            <option value="">Selecione o perfil</option>
            <option value="USUARIO">Usuário</option>
            <option value="ADMIN">Administrador</option>
            <option value="BIBLIOTECARIO">Bibliotecário</option>
          </select>
        ) : (
          <input type="text" name="perfil" value="USUARIO" disabled />
        )}

        <input type="password" name="senha" placeholder="Senha" value={form.senha} onChange={handleChange} required />

        {error && <div className="sgb-error">{error}</div>}
        <div className="sgb-modal-actions">
          <button type="submit" disabled={loading}>
            {loading ? 'Salvando...' : 'Salvar'}
          </button>
          <button type="button" className="sgb-btn-cancelar" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </form>
    </div>
  );
}
