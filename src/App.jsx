import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      {/* Mostrar Navbar solo si hay usuario */}
      {user && <Navbar />}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
