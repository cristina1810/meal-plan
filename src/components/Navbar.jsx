// src/components/Navbar.jsx
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, signOut } = useAuth();

  return (
    <nav
      style={{
        padding: 12,
        borderBottom: "1px solid #eee",
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        <Link to="/">Inicio</Link> {" | "}
        <Link to="/ingredients">Ingredientes</Link> {" | "}
        <Link to="/recipes">Recetas</Link>
      </div>

      <div>
        {user ? (
          <>
            <span style={{ marginRight: 8 }}>{user.email}</span>
            <button onClick={() => signOut()}>Salir</button>
          </>
        ) : (
          <Link to="/login">Iniciar sesión</Link>
        )}
      </div>
    </nav>
  );
}
