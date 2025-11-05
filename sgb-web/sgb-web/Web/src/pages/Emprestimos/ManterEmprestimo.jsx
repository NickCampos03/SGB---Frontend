import { useEffect, useState } from 'react';

export default function EmprestimosPage({ user }) {
  const [emprestimos, setEmprestimos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [filtros, setFiltros] = useState({ emAtraso: '', usuario: '', codigoLivro: '' });
  const [usuarios, setUsuarios] = useState([]);
  const [livros, setLivros] = useState([]);
  const [showModalEmprestimo, setShowModalEmprestimo] = useState(null);
  const [showNovoEmprestimo, setShowNovoEmprestimo] = useState(false);

  const perfil = user?.perfil || localStorage.getItem('perfil');
  const isUsuario = perfil === 'USUARIO';
  

  // Buscar usuários
  useEffect(() => {
    if (!isUsuario) {
      fetch('/usuarios?perfil=USUARIO', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      })
        .then(res => res.json())
        .then(data => setUsuarios(Array.isArray(data) ? data : []))
        .catch(() => setUsuarios([]));
    }
  }, [isUsuario]);

  // Buscar livros para filtro e seleção
  useEffect(() => {
    fetch('/emprestimos', {
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const livrosUnicos = [];
          const seen = new Set();
          data.forEach(e => {
            const key = `${e.livro.codigoLivro}|${e.livro.nome}`;
            if (!seen.has(key)) {
              seen.add(key);
              livrosUnicos.push({codigoLivro: e.livro.codigoLivro, nomeLivro: e.livro.nome });
            }
          });
          setLivros(livrosUnicos);
        } else setLivros([]);
      })
      .catch(() => setLivros([]));
  }, []);

  // Buscar empréstimos conforme filtros
  useEffect(() => {
    buscarEmprestimos();
  }, [filtros, isUsuario]);

function buscarEmprestimos() {
  setLoading(true);
  setError('');
  const params = [];

  if (filtros.emAtraso === 'true') params.push('emAtraso=true');
  if (filtros.emAtraso === 'false') params.push('emAtraso=false');
  if (filtros.emAtraso === 'entregue') params.push('entregue=true');

  if (filtros.usuario && !isUsuario) {
    params.push(`usuario=${filtros.usuario}`);
  }

  if (filtros.codigoLivro) {
    params.push(`codigoLivro=${filtros.codigoLivro}`);
  }

  const query = params.length ? `?${params.join('&')}` : '';

  fetch(`/emprestimos${query}`, {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  })
    .then(res => res.json())
    .then(data => setEmprestimos(Array.isArray(data) ? data : []))
    .catch(() => setError('Erro ao buscar empréstimos.'))
    .finally(() => setLoading(false));
}



  function handleFiltroChange(e) {
    const { name, value } = e.target;
    setFiltros(f => ({ ...f, [name]: value }));
  }

  function handleCardClick(emprestimo) {
    if (!isUsuario) setShowModalEmprestimo(emprestimo);
  }

  function handleCloseModalEmprestimo(atualizou) {
    setShowModalEmprestimo(null);
    if (atualizou) buscarEmprestimos();
  }

  return (
    <>
      <h2>Empréstimos</h2>
      <div className="sgb-livros-filtros" style={{ marginBottom: '1.5rem' }}>
        <select name="emAtraso" value={filtros.emAtraso} onChange={handleFiltroChange} style={{ minWidth: 140 }}>
          <option value="">Todos</option>
          <option value="true">Em atraso</option>
          <option value="false">Em dia</option>
          <option value="entregue">Entregue</option>
        </select>
        {!isUsuario && (
          <select name="usuario" value={filtros.codigoLogin} onChange={handleFiltroChange} style={{ minWidth: 180 }}>
            <option value="">Selecione o usuário</option>
            {usuarios.map(u => <option key={u.codigoLogin} value={u.codigoLogin}>{u.nome} #{u.codigoLogin}</option>)}
          </select>
        )}
        <select name="codigoLivro" value={filtros.codigoLivro} onChange={handleFiltroChange} style={{ minWidth: 180 }}>
          <option value="">Selecione o livro</option>
          {livros.map(l => (<option key={l.codigoLivro} value={l.codigoLivro}>{l.nomeLivro} #{l.codigoLivro}</option>))}
        </select>
      </div>

      {error && <p className="sgb-error">{error}</p>}

      <div className="sgb-emprestimos-list">
        {emprestimos.map(e => (
          <EmprestimoCard
            key={e.codigoEmprestimo}
            emprestimo={e}
            onClick={() => handleCardClick(e)}
            isClickable={!isUsuario}
          />
        ))}
        {(!loading && emprestimos.length === 0 && !error) && <p>Nenhum empréstimo encontrado.</p>}
      </div>

      {/* Modal de edição/recebimento */}
      {showModalEmprestimo && (
        <EmprestimoModal
          emprestimo={showModalEmprestimo}
          onClose={handleCloseModalEmprestimo}
        />
      )}

      {/* Modal de Novo Empréstimo */}
      {showNovoEmprestimo && (
        <NovoEmprestimoModal
          onClose={() => setShowNovoEmprestimo(false)}
          onSuccess={buscarEmprestimos}
          perfil={perfil}
        />
      )}
    </>
  );
}

// ================== Modal de Empréstimo ==================
function EmprestimoModal({ emprestimo, onClose }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [editEntrega, setEditEntrega] = useState(false);
  const [dataEntrega, setDataEntrega] = useState(emprestimo.dataDeEntrega ? emprestimo.dataDeEntrega.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [emprestimoAtual, setEmprestimoAtual] = useState(emprestimo);
  const [atualizou, setAtualizou] = useState(false);
  const entregue = Boolean(emprestimoAtual.dataDeEntrega);

  function handleReceber() { setEditEntrega(true); }

function handleSalvar(e) {
  e.preventDefault();
  setLoading(true);
  setError('');
  setSuccess('');

  const body = { dataDeEntrega: dataEntrega };

  fetch(`/emprestimos/${emprestimoAtual.codigoEmprestimo}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${localStorage.getItem('token')}`,
    },
    body: JSON.stringify(body),
  })
    .then(res => res.ok ? res.json() : Promise.reject(res))
    .then(data => {
      setSuccess('Empréstimo recebido com sucesso!');
      // força atualização local
      setEmprestimoAtual(prev => ({
        ...prev,
        ...data,
        dataDeEntrega: dataEntrega,
        emAtraso: false // força mudança para entregue
      }));
      setEditEntrega(false);
      setAtualizou(true);
    })
    .catch(async err => {
      let msg = 'Erro ao salvar entrega. ' + await err.text();
      setError(msg);
    })
    .finally(() => setLoading(false));
}
  function handleExcluir() {
    if (!window.confirm('Tem certeza que deseja excluir este empréstimo?')) return;
    setLoading(true);
    setError('');
    fetch(`/emprestimos/${emprestimoAtual.codigoEmprestimo}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
    })
      .then(res => {
        if (res.ok) {
          setSuccess('Empréstimo excluído com sucesso!');
          setAtualizou(true);
          setTimeout(() => onClose(true), 1200);
        } else setError('Erro ao excluir empréstimo.');
      })
      .catch(() => setError('Erro ao excluir empréstimo.'))
      .finally(() => setLoading(false));
  }

  return (
    <div className="sgb-modal-bg">
      <form className="sgb-modal-form" onSubmit={handleSalvar}>
        <button className="sgb-modal-close-x" onClick={() => onClose(atualizou)} type="button" title="Fechar">×</button>
        <h3>Empréstimo #{emprestimoAtual.codigoEmprestimo}</h3>
        <div style={{marginBottom:'0.5rem'}}>
          <b>Livro:</b> {emprestimoAtual.livro.nome} #{emprestimoAtual.livro.codigoLivro}<br/>
          <b>Usuário:</b> {emprestimoAtual.usuario.nome} #{emprestimoAtual.usuario.codigoLogin}<br/>
          <b>Retirada:</b> {formatDataBR(emprestimoAtual.dataDeRetirada)}<br/>
          <b>Prevista:</b> {formatDataBR(emprestimoAtual.dataPrevista)}<br/>
          <b>Entrega:</b> {editEntrega ? (
            <input type="date" value={dataEntrega} onChange={e => setDataEntrega(e.target.value)} required style={{marginLeft:4}} />
          ) : (
            formatDataBR(emprestimoAtual.dataDeEntrega)
          )}<br/>
          <div className="sgb-emprestimo-status-row">
            {!emprestimoAtual.dataDeEntrega && emprestimoAtual.emAtraso && (
              <span className="sgb-emprestimo-status-atraso">Em atraso</span>
            )}

            {emprestimo.emAtraso && !entregue && (
              <div className="sgb-emprestimo-saldo">
                Saldo devedor: R$ {emprestimoAtual.valorDevendo.toFixed(2)}
              </div>
            )}

            {!emprestimoAtual.emAtraso && !emprestimoAtual.dataDeEntrega && (
              <span className="sgb-emprestimo-tag-emdia">Em dia</span>
            )}
            {emprestimoAtual.dataDeEntrega && (
              <div className="sgb-emprestimo-tag-entregue">Entregue</div>
            )}
          </div>
        </div>
        {error && <div className="sgb-error">{error}</div>}
        {success && <div className="sgb-success">{success}</div>}
        <div className="sgb-modal-actions">
          {!entregue && !editEntrega && <button className="sgb-btn-emprestar" type="button" onClick={handleReceber} disabled={loading}>Receber</button>}
          {!entregue && editEntrega && <button className="sgb-btn-salvar" type="submit" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>}
          <button className="sgb-btn-excluir" type="button" onClick={handleExcluir} hidden={loading}>Excluir</button>
        </div>
      </form>
    </div>
  );
}

// ================== Modal de Novo Empréstimo ==================
function NovoEmprestimoModal({ onClose, onSuccess, perfil, livroSelecionado }) {
  const [usuarios, setUsuarios] = useState([]);
  const [livros, setLivros] = useState([]);
  const [usuario, setUsuario] = useState('');
  const [livro, setLivro] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isUsuario = perfil === 'USUARIO';
  const hoje = new Date();
  const dataRetirada = hoje.toISOString().slice(0, 10);
  const dataPrevista = new Date(hoje.getTime() + 14*24*60*60*1000).toISOString().slice(0,10);

    useEffect(() => {
      if (!isUsuario) {
        fetch('/usuarios?perfil=USUARIO', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        })
          .then(res => res.json())
          .then(data => setUsuarios(Array.isArray(data) ? data : []))
          .catch(() => setUsuarios([]));
      } else {
        // Se for usuário comum, define ele mesmo no campo
        setUsuario(localStorage.getItem('userId'));
      }

      fetch('/livros?disponibilidade=DISPONIVEL', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.json())
        .then(data => setLivros(Array.isArray(data) ? data : []))
        .catch(() => setLivros([]));
    }, [isUsuario]);

    useEffect(() => {
      if (livroSelecionado) {
        setLivro(livroSelecionado.codigoLivro);
      }
    }, [livroSelecionado]);

  function handleSalvar(e) {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    const usuarioCodigo = Number(usuario);
    const livroCodigo = Number(livro);

    if (!usuarioCodigo || !livroCodigo) {
      setError('Selecione o livro e o usuário.');
      setLoading(false);
      return;
    }
    const body = {
      usuario: { codigoLogin: usuarioCodigo },
      livro: { codigoLivro: livroCodigo },
      dataRetirada,
      dataPrevista      
    };

    fetch('/emprestimos', {
      method: 'POST',
      headers: { 'Content-Type':'application/json', Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: JSON.stringify(body)
    })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(() => { setSuccess('Empréstimo realizado com sucesso!'); onSuccess(); })
      .catch(async err => {
        let msg = 'Erro ao realizar empréstimo.';
        if (err && err.json) { try { const data = await err.json(); if (data?.message) msg = data.message; } catch {} }
        setError(msg);
      })
      .finally(() => setLoading(false));
  }

  return (
    <div className="sgb-modal-bg">
      <form className="sgb-modal-form" onSubmit={handleSalvar}>
        <button className="sgb-modal-close-x" onClick={onClose} type="button" title="Fechar">×</button>
        <h3>Novo Empréstimo</h3>
        {!isUsuario && (
          <>
            <label>Usuário</label>
            <select value={usuario} onChange={e => setUsuario(e.target.value)} required>
              <option value="">Selecione o usuário</option>
              {usuarios.map(u => <option key={u.codigoLogin} value={u.codigoLogin}>{u.nome} #{u.codigoLogin}</option>)}
            </select>
          </>
        )}
        <label>Livro</label>
        <select value={livro} onChange={e => setLivro(e.target.value)} required>
          <option value="">Selecione o livro</option>
          {livros.map(l => <option key={l.codigoLivro} value={l.codigoLivro}>{l.nome} #{l.codigoLivro}</option>)}
        </select>
        {error && <div className="sgb-error">{error}</div>}
        {success && <div className="sgb-success">{success}</div>}
        <button type="submit" className="sgb-btn-emprestar" disabled={loading}>{loading ? 'Salvando...' : 'Salvar'}</button>
      </form>
    </div>
  );
}

// ================== Card ==================
function EmprestimoCard({ emprestimo, onClick, isClickable }) {
  const hoje = new Date();
  const entregue = Boolean(emprestimo.dataDeEntrega);
  const emDia = !emprestimo.emAtraso && !entregue;


  return (
    <div
      className={`sgb-emprestimo-card${emprestimo.emAtraso ? ' sgb-emprestimo-atrasado' : ''}${isClickable ? ' sgb-emprestimo-card-clickable' : ''}`}
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        cursor: isClickable ? 'pointer' : undefined,
      }}
      onClick={isClickable ? onClick : undefined}
      tabIndex={isClickable ? 0 : undefined}
    >
      <div>
        <div className="sgb-emprestimo-codigo" style={{ marginBottom: '0.5rem' }}>
          Empréstimo #{emprestimo.codigoEmprestimo}
        </div>
        <div className="sgb-emprestimo-livro">
          Livro: <b>{emprestimo.livro.nome} #{emprestimo.livro.codigoLivro}</b>
        </div>
        <div className="sgb-emprestimo-usuario">
          Usuário: {emprestimo.usuario.nome} #{emprestimo.usuario.codigoLogin}
        </div>
        <div className="sgb-emprestimo-datas">
          <span>Retirada: {formatDataBR(emprestimo.dataDeRetirada)}</span>
          <span>Prevista: {formatDataBR(emprestimo.dataPrevista)}</span>
          <span>Entrega: {formatDataBR(emprestimo.dataDeEntrega)}</span>
        </div>
      </div>

      <div className="sgb-emprestimo-status-row">
        {emprestimo.emAtraso && !entregue && (() => {
          const dataPrevista = new Date(emprestimo.dataPrevista);
          const diffMs = hoje - dataPrevista;
          const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
          return (
            <span className="sgb-emprestimo-status-atraso">
              Em atraso ({diffDias} dias)
            </span>
          );
        })()}

        {emprestimo.emAtraso && !entregue && (
          <div className="sgb-emprestimo-saldo">
            Saldo devedor: R$ {emprestimo.valorDevendo.toFixed(2)}
          </div>
        )}

        {emDia && <span className="sgb-emprestimo-tag-emdia">Em dia</span>}
        {entregue && <div className="sgb-emprestimo-tag-entregue">Entregue</div>}
      </div>
    </div>
  );
}

function formatDataBR(data) {
  if (!data) return '-';
  const d = new Date(data);
  if (isNaN(d)) return data;
  return d.toLocaleDateString('pt-BR');
}
export { NovoEmprestimoModal };
