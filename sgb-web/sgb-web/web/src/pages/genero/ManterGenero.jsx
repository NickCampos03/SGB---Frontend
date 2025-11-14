import { useEffect, useState } from 'react';

export default function GeneroPage({ user, isAdminOrBiblio }) {
  const [generos, setGeneros] = useState([]);
  const [generosFiltrados, setGenerosFiltrados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [filtros, setFiltros] = useState({ nome: "" });
  const [showCreate, setShowCreate] = useState(false);
  const [showGenero, setShowGenero] = useState(null);

  // --- Buscar gêneros ---
  function buscarGeneros() {
    fetch("/generos", {
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Erro ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (Array.isArray(data)) {
          data.sort((a, b) => a.nome.localeCompare(b.nome));
          setGeneros(data);
        } else {
          setGeneros([]);
        }
      })
      .catch(() => setError("Erro ao buscar gêneros."))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    buscarGeneros();
  }, []);

  // --- Filtrar localmente ---
  useEffect(() => {
    let filtrados = generos;
    if (filtros.nome) {
      filtrados = filtrados.filter((g) =>
        g.nome.toLowerCase().includes(filtros.nome.toLowerCase())
      );
    }
    setGenerosFiltrados(filtrados);
  }, [generos, filtros.nome]);

  function handleFiltroChange(e) {
    const { name, value } = e.target;
    setFiltros((f) => ({ ...f, [name]: value }));
  }

  // --- Criar gênero ---
  function CriarGeneroForm({ onClose, onCreated }) {
    const [nome, setNome] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleSubmit(e) {
      e.preventDefault();
      if (!nome.trim()) {
        setError("Preencha o nome do gênero.");
        return;
      }
      setLoading(true);
      fetch("/generos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ nome }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && data.id) {
            onCreated(data);
          } else setError("Erro ao criar gênero.");
        })
        .catch(() => setError("Erro ao criar gênero."))
        .finally(() => setLoading(false));
    }

    return (
      <div className="sgb-modal-bg">
        <form className="sgb-modal-form" onSubmit={handleSubmit}>
          <button className="sgb-modal-close-x" onClick={onClose} type="button" title="Fechar">×</button>
          <h3> Novo Genero</h3>
          <input placeholder="Nome do Genero" value={nome} onChange={e => setNome(e.target.value)} required />
          {error && <div className="sgb-error">{error}</div>}
          <div className="sgb-modal-actions">
            <button type="button" className="sgb-btn-cancelar" onClick={onClose}>Cancelar</button>
            <button type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </form>
      </div>
    );
  }

  // --- Modal de gênero (edição/exclusão) ---
  function GeneroModal({ genero, onClose, onUpdated, isAdminOrBiblio }) {
    const [editMode, setEditMode] = useState(false);
    const [form, setForm] = useState({ nome: genero.nome });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    useEffect(() => {
      setForm({ nome: genero.nome });
    }, [genero]);

    function handleChange(e) {
      setForm({ ...form, [e.target.name]: e.target.value });
    }

    function handleSave(e) {
      e.preventDefault();
      setLoading(true);
      setError("");
      fetch(`/generos/${genero.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ nome: form.nome }),
      })
        .then((res) => res.json())
        .then(() => {
          setEditMode(false);
          setSuccess("Gênero atualizado com sucesso!");
          onUpdated();
          setTimeout(() => setSuccess(""), 2000);
        })
        .catch(() => setError("Erro ao atualizar gênero."))
        .finally(() => setLoading(false));
    }

    function handleDelete() {
      if (!window.confirm("Tem certeza que deseja excluir este gênero?")) return;
      setLoading(true);
      fetch(`/generos/${genero.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      })
        .then((res) => {
          if (res.ok) {
            setSuccess("Gênero excluído com sucesso!");
            onUpdated();
            setTimeout(() => {
              setSuccess("");
              onClose();
            }, 2000);
          } else setError("Erro ao excluir gênero.");
        })
        .catch(() => setError("Erro ao excluir gênero."))
        .finally(() => setLoading(false));
    }

    return (
      <div className="sgb-modal-bg">
        <form className="sgb-modal-form" onSubmit={handleSave}>
          <button
            className="sgb-modal-close-x"
            onClick={onClose}
            type="button"
            title="Fechar"
          >
            ×
          </button>
          <h3>Gênero #{genero.id}</h3>
          <input
            name="nome"
            value={form.nome}
            onChange={handleChange}
            disabled={!editMode}
            required
          />
          {error && <div className="sgb-error">{error}</div>}
          {success && <div className="sgb-success">{success}</div>}
          <div className="sgb-modal-actions">
            {isAdminOrBiblio && !editMode && (
              <button className = 'sgb-btn-editar'type="button" onClick={() => setEditMode(true)}>
                Editar
              </button>
            )}
            {isAdminOrBiblio && editMode && (
              <button type="submit" disabled={loading}>
                {loading ? "Salvando..." : "Salvar"}
              </button>
            )}
            {isAdminOrBiblio && (
              <button className = 'sgb-btn-excluir'type="button" onClick={handleDelete}>
                Excluir
              </button>
            )}
          </div>
        </form>
      </div>
    );
  }

  // --- Card de gênero (agora padronizado com LivrosPage) ---
  function GeneroCard({ genero, onClick, isClickable }) {
    return (
      <div
        className={`sgb-livro-card${isClickable ? " sgb-card-clickable" : ""}`}
        onClick={onClick}
      >
        <p className="sgb-id">#{genero.id}</p>
        <p className="sgb-nome">{genero.nome}</p>
      </div>
    );
  }

  return (
    <>
      <h2>Gêneros</h2>
      <div className="sgb-livros-filtros">
        {isAdminOrBiblio && (<button className="sgb-btn-criar-emprestimo" onClick={() => setShowCreate(true)}>
          + Novo Genero
        </button>)}
        <input
          name="nome"
          placeholder="Filtrar por nome"
          value={filtros.nome}
          onChange={handleFiltroChange}
        />
      </div>

      {showCreate && (
        <CriarGeneroForm onClose={() => setShowCreate(false)} onCreated={(data) => {setShowGenero(data); setShowCreate(false);}}/>
      )}
      {showGenero && (
        <GeneroModal
          genero={showGenero}
          onClose={() => setShowGenero(null)}
          onUpdated={buscarGeneros}
          isAdminOrBiblio={isAdminOrBiblio}
        />
      )}
      {error && <p className="sgb-error">{error}</p>}

      <div className="sgb-livros-list">
        {generosFiltrados.map((genero) => (
          <GeneroCard
            key={genero.id}
            genero={genero}
            onClick={() => setShowGenero(genero)}
            isClickable={isAdminOrBiblio}
          />
        ))}
        {!loading && generosFiltrados.length === 0 && (
          <p>Nenhum gênero encontrado.</p>
        )}
      </div>
    </>
  );
}
