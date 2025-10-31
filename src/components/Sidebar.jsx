import { Link, useLocation } from "react-router-dom";
import { Book, PiggyBank, Calendar, Carrot, X } from "lucide-react";
import { supabase } from "../api/supabaseClient";
import { LogOut, Settings } from "lucide-react";

export default function Sidebar({ onClose }) {
  const location = useLocation();
  const menuItems = [
    { id: 1, label: "Ingredientes", icon: Carrot, path: "/" },
    {
      id: 2,
      label: "Lista de Compra",
      icon: PiggyBank,
      path: "/shopping-list",
    },
    { id: 3, label: "Recetas", icon: Book, path: "/recipes" },

    { id: 4, label: "Plan Semanal", icon: Calendar, path: "/weekly-plan" },
  ];
  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="w-64 bg-white shadow-lg fixed left-0 top-0 h-full z-40 ">
      <div className="p-6 border-b border-gray-200 flex justify-between">
        <h1 className="text-2xl font-bold text-[var(--text-primary-light)] dark:text-[var(--text-primary-dark)]">
          Mi Cocina
        </h1>
        <button onClick={onClose}>
          <X />
        </button>
      </div>

      <nav className="p-4">
        <ul className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={onClose}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all  ${
                    isActive
                      ? "bg-gray-200 text-black shadow-md"
                      : "text-[var(--text-primary-light)] hover:bg-[var(--primary)]/10"
                  }`}
                >
                  <Icon size={24} />
                  <span className="font-medium">{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
        <div className="flex justify-center flex-col w-full p-4 items-center gap-2 bottom-0">
          <Link to="/config" className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            <button>Configuración</button>
          </Link>
          <div className="flex items-center gap-2  text-red-500">
            <LogOut className="w-5 h-5" />
            <button onClick={logout}>Cerrar sesión</button>
          </div>
        </div>
      </nav>
    </div>
  );
}
