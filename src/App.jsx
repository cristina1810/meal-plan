import { Outlet } from "react-router-dom";
import Sidebar from "./components/Sidebar";
import { useAuth } from "./context/AuthContext";

const App = () => {
  const { user } = useAuth();

  return (
    <div className="app-container">
      {/* Mostrar Navbar solo si hay usuario */}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default App;
