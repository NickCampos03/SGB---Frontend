import { useState } from "react";
import { Link } from "react-router-dom";

export default function RealizarCadastro() {
  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefone: "",
    dataDeNascimento: "",
    senha: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess(false);

    if (!form.nome || !form.email || !form.telefone || !form.dataDeNascimento || !form.senha) {
      setError("Preencha todos os campos obrigatórios.");
      return;
    }


    setLoading(true);

    try {
      const response = await fetch('/usuarios/publico', {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
            body: JSON.stringify({
            nome: form.nome,
            email: form.email,
            senha: form.senha,
            dataDeNascimento: form.dataDeNascimento,
            telefone: form.telefone,
            }),
            
      });

      if (response.ok) {
        setSuccess(true);
        setForm({
          nome: "",
          email: "",
          telefone: "",
          dataDeNascimento: "",
          senha: "",
        });
      } else {
        const data = await response.json().catch(() => ({}));
        setError(data.message || "Erro ao cadastrar usuário.");
      }
    } catch (err) {
      setError("Erro de conexão com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="sgb-container">
      <h2>Crie sua conta</h2>

      <form className="sgb-form" onSubmit={handleSubmit}>
        <input
          type="text"
          name="nome"
          placeholder="Nome completo"
          value={form.nome}
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="E-mail"
          value={form.email}
          onChange={handleChange}
          required
        />

        <input
          type="tel"
          name="telefone"
          placeholder="Telefone"
          value={form.telefone}
          onChange={handleChange}
          maxLength="11"
          required
        />

        <input
          type="date"
          name="dataDeNascimento"
          value={form.dataDeNascimento}
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="senha"
          placeholder="Senha"
          value={form.senha}
          onChange={handleChange}
          required
        />


        <button type="submit" disabled={loading}>
          {loading ? "Cadastrando..." : "Cadastrar"}
        </button>

        {error && <div className="sgb-error">{error}</div>}
        {success && <div className="sgb-success">Usuário cadastrado com sucesso!</div>}
      </form>

      <p className="sgb-cadastro">
        Já tem conta?{" "}
        <Link to="/" style={{ color: "#6366f1", textDecoration: "none" }}>
          Faça login
        </Link>
      </p>
    </div>
  );
}
