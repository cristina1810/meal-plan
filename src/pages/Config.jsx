import { useAuth } from "../context/AuthContext";
import { supabase } from "../api/supabaseClient";

const Config = () => {
  const { user } = useAuth();

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };
  return (
    <div className=" items-center justify-center h-screen p-4">
      <h1 className="text-2xl font-bold text-center">Configuración</h1>
      <p className="text-lg text-center"> {user?.email}</p>
      <p className="text-lg">Marcas</p>
      <p className="text-lg">Tiendas</p>
      <p className="text-lg">Tags</p>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded justify-center w-full"
        onClick={handleLogout}
      >
        Cerrar sesión
      </button>
    </div>
  );
};
export default Config;
