import { useState } from "react";
import { Link } from "react-router-dom";

export default function RealizarLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();
      if (data.status === "success" && data.token) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("perfil", data.perfil);
        localStorage.setItem("user", data.user);
        localStorage.setItem("userId", data.userId);
        onLogin && onLogin(data);
      } else {
        setError("Login inválido.");
      }
    } catch (err) {
      setError("Erro ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="sgb-form" onSubmit={handleSubmit}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Senha"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <button type="submit" disabled={loading}>
        {loading ? "Entrando..." : "Entrar"}
      </button>

      <h3 className="sgb-cadastro">
        Não tem cadastro?{" "}
        <Link to="/cadastro" style={{ color: "#6366f1", textDecoration: "none" }}>
          Clique aqui
        </Link>
      </h3>

      {error && <div className="sgb-error">{error}</div>}
    </form>
  );
}
