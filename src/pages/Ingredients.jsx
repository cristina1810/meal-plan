import React, { useEffect, useState } from "react";
import { fetchIngredients, getIngredientById } from "../api/api"; // 👈 asegúrate de tener getIngredientById
import useGlobalReducer from "../context/useGlobalReducer";
import IngredientCard from "../components/IngredientCard";
import { useAuth } from "../context/AuthContext";
import { TIPOS_INGREDIENTES } from "../constants";
import { ChevronDown, Menu, Plus } from "lucide-react";
import IngredientForm from "../components/IngredientForm";
import Sidebar from "../components/Sidebar";

export default function Ingredients() {
  const { store, dispatch } = useGlobalReducer();
  const { user } = useAuth();

  const [tipoSeleccionado, setTipoSeleccionado] = useState("");
  const [visibleTypes, setVisibleTypes] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [ingredienteEditando, setIngredienteEditando] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Cargar ingredientes
  useEffect(() => {
    let mounted = true;
    async function load() {
      if (!user) return;
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await fetchIngredients();
        if (!mounted) return;
        dispatch({ type: "SET_INGREDIENTS", payload: data });
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

  // Inicializar tipos visibles
  useEffect(() => {
    if (store.ingredients?.length) {
      const tipos = [...new Set(store.ingredients.map((i) => i.type))];
      setVisibleTypes((prev) => {
        const newState = { ...prev };
        tipos.forEach((tipo) => {
          if (!(tipo in newState)) {
            newState[tipo] = true; // solo inicializa los nuevos tipos
          }
        });
        return newState;
      });
    }
  }, [store.ingredients]);

  // Cerrar formulario
  const handleCloseForm = () => {
    setShowForm(false);
    setIngredienteEditando(null);
  };

  const handleEdit = async (ingredient) => {
    try {
      const fullIngredient = await getIngredientById(ingredient.id);
      console.log("🔍 Ingrediente cargado completo:", fullIngredient);
      setIngredienteEditando(fullIngredient);
      setShowForm(true);
    } catch (err) {
      console.error("Error al cargar ingrediente:", err);
      alert("Error al cargar el ingrediente.");
    }
  };

  // Agrupar por tipo
  const groupedIngredients = store.ingredients?.reduce((acc, i) => {
    const tipoKey = i.type || "Sin categoría";
    if (!acc[tipoKey]) acc[tipoKey] = [];
    acc[tipoKey].push(i);
    return acc;
  }, {});

  if (!user) return <p>Cargando usuario...</p>;

  return (
    <div>
      {/* ENCABEZADO */}
      <div className="flex items-center gap-2 p-4 sticky top-0 bg-[var(--bg-light)]/80 backdrop-blur-sm justify-between">
        <Menu onClick={() => setSidebarOpen(true)} />
        <h1 className="text-2xl font-bold">Ingredientes</h1>
        <Plus onClick={() => setShowForm(true)} />
      </div>

      {store.loading && <p>Cargando...</p>}
      {store.error && <p style={{ color: "red" }}>{store.error}</p>}

      {/* Pills de tipos */}
      <div className="sticky top-0 bg-[var(--bg-light)]/80 backdrop-blur-sm flex overflow-x-auto gap-2 p-4 hide-scrollbar">
        <button
          className={`flex items-center justify-center rounded-full px-5 py-1 flex-shrink-0 ${
            tipoSeleccionado === ""
              ? "bg-[var(--pill-selected-color)] text-white"
              : "bg-[var(--pill-unselected-color)] dark:bg-[var(--pill-unselected-color)] text-[var(--text-secondary-light)] hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
          }`}
          onClick={() => setTipoSeleccionado("")}
        >
          Todos
        </button>
        {TIPOS_INGREDIENTES.map((tipo) => (
          <button
            key={tipo}
            className={`px-4  rounded-full  ${
              tipoSeleccionado === tipo
                ? "bg-[var(--pill-selected-color)] text-white"
                : "bg-[var(--pill-unselected-color)] dark:bg-[var(--pill-unselected-color)] text-[var(--text-secondary-light)] hover:bg-[var(--primary)]/20 hover:text-[var(--primary)]"
            }`}
            onClick={() => setTipoSeleccionado(tipo)}
          >
            {tipo}
          </button>
        ))}
      </div>

      {/* LISTA DE INGREDIENTES */}
      <div className="grid gap-4 mx-4">
        {store.ingredients?.length === 0 && !store.loading ? (
          <p>No hay ingredientes.</p>
        ) : tipoSeleccionado ? (
          store.ingredients
            .filter((i) => i.type === tipoSeleccionado)
            .map((i) => (
              <IngredientCard
                key={i.id}
                ingredient={i}
                onEdit={handleEdit} // 👈 usa handleEdit
              />
            ))
        ) : (
          Object.entries(groupedIngredients).map(([tipo, ingredientes]) => (
            <div key={tipo} className="mb-2 ">
              <button
                className="w-full text-left font-semibold text-lg py-2 px-2 bg-[var(--pill-unselected-color)] rounded-full flex justify-between items-center"
                onClick={() =>
                  setVisibleTypes((prev) => ({
                    ...prev,
                    [tipo]: !prev[tipo],
                  }))
                }
              >
                <span className="flex items-center gap-2 ml-2">
                  {tipo} ({ingredientes.length})
                </span>
                {visibleTypes[tipo] ? (
                  <ChevronDown className="rotate-180 mr-2" />
                ) : (
                  <ChevronDown className="mr-2" />
                )}
              </button>
              {visibleTypes[tipo] &&
                ingredientes.map((i) => (
                  <IngredientCard
                    key={i.id}
                    ingredient={i}
                    onEdit={handleEdit} // 👈 usa handleEdit también aquí
                  />
                ))}
            </div>
          ))
        )}
      </div>

      {/* FORMULARIO MODAL */}
      {showForm && (
        <IngredientForm
          setShowForm={handleCloseForm}
          ingrediente={ingredienteEditando}
          setIngredienteEditando={setIngredienteEditando}
        />
      )}
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}
    </div>
  );
}
