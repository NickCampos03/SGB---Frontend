import { useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Login from "./pages/login/RealizarLogin";
import RealizarCadastro from "./pages/cadastro/RealizarCadastro";
import SideMenu from "./components/SideMenu";
import MainContent from "./components/MainContent";

function App() {
  const [user, setUser] = useState(null);
  const [selected, setSelected] = useState(localStorage.getItem("selectedMenu") || "livros");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const perfil = localStorage.getItem("perfil");
    const email = localStorage.getItem("user");

    if (token && perfil) {
      setUser({ user: email || "", perfil, token });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    localStorage.setItem("selectedMenu", selected);
  }, [selected]);

  if (loading) return null;

  return (
    <Routes>
      {/* Rota de login */}
      <Route
        path="/"
        element={
          user ? (
            <div className="sgb-app-layout">
              <SideMenu perfil={user.perfil} selected={selected} onSelect={setSelected} />
              <MainContent
                selected={selected}
                user={user}
                onLogout={() => {
                  localStorage.clear();
                  setUser(null);
                  navigate("/");
                }}
              />
            </div>
          ) : (
            <div className="sgb-container">
              <div
                style={{
                  fontWeight: 800,
                  fontSize: "2.1rem",
                  color: "#6366f1",
                  letterSpacing: "1px",
                  marginBottom: "0.2rem",
                  marginTop: "-0.5rem",
                }}
              >
                SGB
              </div>
              <div className="sgb-subtitle">Sistema de Gerenciamento de Biblioteca</div>
              <hr
                style={{
                  width: "90%",
                  border: 0,
                  borderTop: "4px solid #6366f1",
                  borderRadius: "2px",
                  margin: "0 0 1rem 0",
                  boxShadow: "0 1px 6px #6366f133",
                }}
              />
              <Login onLogin={setUser} />
            </div>
          )
        }
      />

      {/* Rota de cadastro */}
      <Route path="/cadastro" element={<RealizarCadastro />} />
    </Routes>
  );
}

export default App;
