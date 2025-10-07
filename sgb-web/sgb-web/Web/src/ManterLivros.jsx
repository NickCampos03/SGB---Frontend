import { useEffect, useState } from 'react';

export default function LivrosPage({ user, isAdminOrBiblio }) {
  const [livros, setLivros] = useState([]);
  const [livrosFiltrados, setLivrosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ nome: '', autor: '', genero: '', disponibilidade: '' });
  const [generos, setGeneros] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showLivro, setShowLivro] = useState(null);
  const [livroCriadoMsg, setLivroCriadoMsg] = useState('');

  // --- Buscar gêneros do backend ---
  useEffect(() => {
    fetch('http://localhost:8080/generos', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => setGeneros(Array.isArray(data) ? data : []))
      .catch(() => setGeneros([]));
  }, []);

  // --- Buscar livros ---
  function buscarLivros() {
  setLoading(true);
  setError('');

  const queryParams = new URLSearchParams();
  if (filtros.genero) queryParams.append("generoId", Number(filtros.genero));
  if (filtros.disponibilidade) queryParams.append("disponibilidade", filtros.disponibilidade);

  const query = queryParams.toString() ? `?${queryParams.toString()}` : "";

  fetch(`http://localhost:8080/livros${query}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem('token')}`
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(`Erro ${res.status}`);
      return res.json();
    })
    .then(data => setLivros(Array.isArray(data) ? data : []))
    .catch(() => setError('Erro ao buscar livros.'))
    .finally(() => setLoading(false));
}

  useEffect(() => { buscarLivros(); }, [filtros.genero, filtros.disponibilidade]);

  // --- Filtrar localmente por nome e autor ---
  useEffect(() => {
    let filtrados = livros;
    if (filtros.nome) filtrados = filtrados.filter(l => l.nome.toLowerCase().includes(filtros.nome.toLowerCase()));
    if (filtros.autor) filtrados = filtrados.filter(l => l.autor.toLowerCase().includes(filtros.autor.toLowerCase()));
    setLivrosFiltrados(filtrados);
  }, [livros, filtros.nome, filtros.autor]);

  function handleFiltroChange(e) {
    const { name, value } = e.target;
    setFiltros(f => ({ ...f, [name]: value }));
  }

  function formatGenero(generoObj) {
    return generoObj?.nome || '';
  }

  // --- Card de livro ---
  function LivroCard({ livro, onClick, isClickable }) {
    return (
      <div
        className={`sgb-livro-card${isClickable ? ' sgb-livro-card-clickable' : ''}`}
        onClick={onClick}
        style={isClickable ? { cursor: 'pointer' } : {}}
      >
        <div className="sgb-livro-codigo">id: {livro.codigolivro}</div>
        <div className="sgb-livro-nome">{livro.nome}</div>
        <div className="sgb-livro-autor">Autor: {livro.autor}</div>
        <div className="sgb-livro-genero">Gênero: {formatGenero(livro.genero)}</div>
        <div className={`sgb-livro-status ${livro.disponibilidade === 'DISPONIVEL' ? 'disponivel' : 'indisponivel'}`}>
          {livro.disponibilidade === 'DISPONIVEL' ? 'Disponível' : 'Indisponível'}
        </div>
      </div>
    );
  }

  // --- Criar livro ---
  function CriarLivroForm({ onClose, onCreated }) {
    const [nome, setNome] = useState('');
    const [autor, setAutor] = useState('');
    const [genero, setGenero] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    function handleSubmit(e) {
      e.preventDefault();
      setError('');
      if (!nome.trim() || !autor.trim() || !genero) {
        setError('Preencha todos os campos.');
        return;
      }
      setLoading(true);
      fetch('http://localhost:8080/livros', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ nome, autor, genero: { id: Number(genero) } }),
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.codigolivro) {
            data.disponibilidade = 'DISPONIVEL';
            onCreated(data);
          } else setError('Erro ao criar livro.');
        })
        .catch(() => setError('Erro ao criar livro.'))
        .finally(() => setLoading(false));
    }

    return (
      <div className="sgb-modal-bg">
        <form className="sgb-modal-form" onSubmit={handleSubmit}>
          <button className="sgb-modal-close-x" onClick={onClose} type="button" title="Fechar">×</button>
          <h3>Novo Livro</h3>
          <input placeholder="Nome do livro" value={nome} onChange={e => setNome(e.target.value)} required />
          <input placeholder="Autor" value={autor} onChange={e => setAutor(e.target.value)} required />
          <select value={genero} onChange={e => setGenero(e.target.value)} required>
            <option value="">Selecione o gênero</option>
            {generos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
          {error && <div className="sgb-error">{error}</div>}
          <div className="sgb-modal-actions">
            <button type="button" className="sgb-btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    );
  }

  // --- Modal de livro (edição/exclusão) ---
  function LivroModal({ livro, onClose, onUpdated, isAdminOrBiblio }) {
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ nome: livro.nome, autor: livro.autor,   disponibilidade: livro.disponibilidade, genero: livro.genero?.id });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(livro._showSuccess ? 'Livro criado com sucesso!' : '');

    useEffect(() => { setForm({ nome: livro.nome, autor: livro.autor,   disponibilidade: livro.disponibilidade, genero: livro.genero?.id }); }, [livro]);

    function handleChange(e) { setForm(f => ({ ...f, [e.target.name]: e.target.value })); }

    function handleSave(e) {
      e.preventDefault();
      setLoading(true);
      setError('');
      fetch(`http://localhost:8080/livros/${livro.codigolivro}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ nome: form.nome, autor: form.autor, disponibilidade:form.disponibilidade, genero: { id: Number(form.genero) } }),
      })
        .then(res => res.json())
        .then(() => {
          setEditMode(false);
          setSuccess('Livro atualizado com sucesso!');
          onUpdated();
          setTimeout(() => setSuccess(''), 2000);
        })
        .catch(() => setError('Erro ao atualizar livro.'))
        .finally(() => setLoading(false));
    }

    function handleDelete() {
      if (!window.confirm('Tem certeza que deseja excluir este livro?')) return;
      setLoading(true);
      fetch(`http://localhost:8080/livros/${livro.codigolivro}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => {
          if (res.ok) {
            setSuccess('Livro excluído com sucesso!');
            onUpdated();
            setTimeout(() => { setSuccess(''); onClose(); }, 2000);
          } else setError('Erro ao excluir livro.');
        })
        .catch(() => setError('Erro ao excluir livro.'))
        .finally(() => setLoading(false));
    }

    return (
      <div className="sgb-modal-bg">
        <form className="sgb-modal-form" onSubmit={handleSave}>
          <button className="sgb-modal-close-x" onClick={onClose} type="button" title="Fechar">×</button>
          <h3>Livro #{livro.codigolivro}</h3>
          <input name="nome" value={form.nome} onChange={handleChange} disabled={!editMode} required />
          <input name="autor" value={form.autor} onChange={handleChange} disabled={!editMode} required />
          <select name="genero" value={form.genero || ''} onChange={handleChange} disabled={!editMode} required>
            <option value="">Selecione o gênero</option>
            {generos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
          </select>
        <select
          name="disponibilidade"
          value={form.disponibilidade || 'DISPONIVEL'}
          onChange={handleChange}
          disabled={!editMode}
          required
        >
          <option value="DISPONIVEL">Disponível</option>
          <option value="INDISPONIVEL">Indisponível</option>
        </select>
          {error && <div className="sgb-error">{error}</div>}
          {success && <div className="sgb-success">{success}</div>}
          <div className="sgb-modal-actions">
            {isAdminOrBiblio && !editMode && <button type="button" onClick={() => setEditMode(true)}>Editar</button>}
            {isAdminOrBiblio && editMode && <button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>}
            {isAdminOrBiblio && <button type="button" onClick={handleDelete}>Excluir</button>}
          </div>
        </form>
      </div>
    );
  }

  return (
    <>
      <h2>Livros</h2>
      <div className="sgb-livros-filtros">
        {isAdminOrBiblio && <button onClick={() => setShowCreate(true)}>+ Criar Livro</button>}
        <input name="nome" placeholder="Filtrar por nome" value={filtros.nome} onChange={handleFiltroChange} />
        <input name="autor" placeholder="Filtrar por autor" value={filtros.autor} onChange={handleFiltroChange} />
        <select name="genero" value={filtros.genero} onChange={handleFiltroChange}>
          <option value="">Todos os gêneros</option>
          {generos.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
        </select>
        <select name="disponibilidade" value={filtros.disponibilidade} onChange={handleFiltroChange}>
          <option value="">Todos</option>
          <option value="DISPONIVEL">Disponível</option>
          <option value="INDISPONIVEL">Indisponível</option>
        </select>
      </div>

      {showCreate && <CriarLivroForm onClose={() => setShowCreate(false)} onCreated={data => { setShowLivro(data); setShowCreate(false); }} />}
      {showLivro && <LivroModal livro={showLivro} onClose={() => setShowLivro(null)} onUpdated={buscarLivros} isAdminOrBiblio={isAdminOrBiblio} />}
      {error && <p className="sgb-error">{error}</p>}

      <div className="sgb-livros-list">
        {livrosFiltrados.map(livro => (
          <LivroCard key={livro.codigolivro} livro={livro} onClick={() => setShowLivro(livro)} isClickable={isAdminOrBiblio} />
        ))}
        {!loading && livrosFiltrados.length === 0 && <p>Nenhum livro encontrado.</p>}
      </div>
    </>
  );
}
