import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import { Menu, Plus } from "lucide-react";
import { TIPOS_RECETA } from "../constants";
import RecipeCard from "../components/RecipeCard";
import useGlobalReducer from "../context/useGlobalReducer";
import { fetchRecipes } from "../api/api";
import RecipeForm from "../components/RecipeForm";
export default function Recipes() {
  const { user } = useAuth();
  const { store, dispatch } = useGlobalReducer();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [showRecipeForm, setShowRecipeForm] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await fetchRecipes();
        if (!mounted) return;
        dispatch({ type: "SET_RECIPES", payload: data });
      } catch (err) {
        dispatch({ type: "SET_ERROR", payload: err.message ?? String(err) });
      } finally {
        if (mounted) dispatch({ type: "SET_LOADING", payload: false });
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [dispatch, user]);

  const filteredRecipes = tipoSeleccionado
    ? store.recipes.filter((r) => r.type === tipoSeleccionado)
    : store.recipes;

  return (
    <div>
      {user ? (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 p-4 sticky top-0 bg-[var(--bg-light)]/80 backdrop-blur-sm justify-between">
            <Menu onClick={() => setSidebarOpen(true)} />
            <h1 className="text-2xl font-bold">Recetas</h1>
            <Plus onClick={() => setShowRecipeForm(true)} />{" "}
            {/* Podrías abrir un form para crear recetas */}
          </div>

          {/* Filtros por tipo */}
          <div className="sticky top-0 bg-[var(--bg-light)]/80 backdrop-blur-sm flex overflow-x-auto gap-2 p-4 py-2 hide-scrollbar">
            <button
              className={`flex items-center justify-center rounded-full px-5 py-2 flex-shrink-0 ${
                tipoSeleccionado === ""
                  ? "bg-[var(--pill-selected-color)] text-white"
                  : "bg-[var(--pill-unselected-color)] dark:bg-[var(--pill-unselected-color)] text-[var(--text-secondary-light)] hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
              }`}
              onClick={() => setTipoSeleccionado("")}
            >
              Todos
            </button>
            {TIPOS_RECETA.map((tipo) => (
              <button
                key={tipo}
                onClick={() => setTipoSeleccionado(tipo)}
                className={`px-4 rounded-full break-normal flex-shrink-0 ${
                  tipoSeleccionado === tipo
                    ? "bg-[var(--pill-selected-color)] text-white"
                    : "bg-[var(--pill-unselected-color)] dark:bg-[var(--pill-unselected-color)] text-[var(--text-secondary-light)] hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>

          {/* Lista de recetas */}
          <div className="grid gap-4 p-4">
            {filteredRecipes.map((recipe) => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </>
      ) : (
        <p>Por favor, inicia sesión para ver las recetas.</p>
      )}
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}
      {showRecipeForm && (
        <RecipeForm
          onClose={() => setShowRecipeForm(false)}
          onRecetaCreada={() => setShowRecipeForm(false)}
          usuario_id={user.id}
        />
      )}
    </div>
  );
}
