import { useEffect, useState } from "react";
import { Menu, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import Sidebar from "../components/Sidebar";
import {
  fetchRecipes,
  fetchWeeklyPlan,
  addRecipeToWeeklyPlan,
  updateWeeklyPlanItem,
  getWeeklyPlanItemWithoutDate,
  addIngredientToAllStores,
} from "../api/api";
import { useAuth } from "../context/AuthContext";
import { Star, StarHalf } from "lucide-react";

const diasSemana = [
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
  "Domingo",
];

export default function WeeklyPlan() {
  const { user } = useAuth();
  const [recetas, setRecetas] = useState([]);
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedReceta, setSelectedReceta] = useState(null);
  const [selectedFecha, setSelectedFecha] = useState(null);
  const [selectedTipo, setSelectedTipo] = useState("Desayuno");
  const [weekOffset, setWeekOffset] = useState(0); // 0 = semana actual, -1 = anterior, +1 = siguiente

  // Obtener fechas de la semana basado en el offset
  const getWeekDates = (offset = 0) => {
    const today = new Date();
    const week = [];
    const dayIndex = today.getDay();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - dayIndex + 1 + i + offset * 7);
      week.push(d.toISOString().split("T")[0]);
    }
    return week;
  };
  const fechasSemana = getWeekDates(weekOffset);

  const formatFecha = (fechaISO) =>
    new Date(fechaISO).toLocaleDateString("es-ES", {
      day: "2-digit",
      month: "long",
    });

  // Cargar recetas y plan semanal
  useEffect(() => {
    if (!user?.id) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const [recetasData, weeklyPlanData] = await Promise.all([
          fetchRecipes(),
          fetchWeeklyPlan(user.id),
        ]);
        setRecetas(recetasData);
        setPlan(weeklyPlanData);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar el plan semanal.");
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, weekOffset]);

  if (loading) return <p>Cargando plan semanal...</p>;
  if (error) return <p>{error}</p>;

  // Recetas sin fecha asignada
  const recetasSinFecha = plan
    .filter((p) => !p.date)
    .map((p) => recetas.find((r) => r.id === p.recipe_id))
    .filter(Boolean);

  const getRecetaFor = (fecha, tipo) => {
    const item = plan.find((p) => p.date === fecha && p.slot === tipo);
    if (!item) return null;
    return recetas.find((r) => r.id === item.recipe_id) || null;
  };

  // Asignar receta a día/tipo y añadir ingredientes urgentes
  const asignarReceta = async () => {
    if (!selectedReceta || !selectedFecha || !selectedTipo) {
      alert("Por favor selecciona fecha y tipo de comida");
      return;
    }

    try {
      // Verificar si la receta ya existe en el plan sin fecha
      const existingItem = await getWeeklyPlanItemWithoutDate(
        user.id,
        selectedReceta.id
      );

      if (existingItem) {
        // Actualizar la entrada existente con fecha y slot
        await updateWeeklyPlanItem(
          user.id,
          selectedReceta.id,
          selectedFecha,
          selectedTipo
        );

        // Actualizar el estado local: eliminar la entrada sin fecha y añadir con fecha
        setPlan((prev) =>
          prev.map((p) =>
            p.id === existingItem.id
              ? { ...p, date: selectedFecha, slot: selectedTipo }
              : p
          )
        );
      } else {
        // Si no existe, crear nueva entrada
        const newPlanItem = await addRecipeToWeeklyPlan(
          user.id,
          selectedReceta.id,
          selectedFecha,
          selectedTipo
        );

        // Actualizar el estado local
        setPlan((prev) => [
          ...prev.filter(
            (p) => !(p.date === selectedFecha && p.slot === selectedTipo)
          ),
          newPlanItem,
        ]);
      }

      // Añadir ingredientes urgentes automáticamente
      const urgentIngredients =
        selectedReceta.ingredients?.filter((i) => i.status === "Urgente") || [];

      let addedCount = 0;
      for (let ingredient of urgentIngredients) {
        try {
          const result = await addIngredientToAllStores(ingredient.id, user.id);
          if (result.length > 0) addedCount += result.length;
        } catch (err) {
          console.warn(`No se pudo añadir ${ingredient.name}:`, err);
          // Continuar con los demás ingredientes
        }
      }

      setShowModal(false);
      setSelectedReceta(null);
      setSelectedFecha(null);
      setSelectedTipo("Desayuno");
    } catch (err) {
      console.error("Error asignando receta:", err);
      alert("Error al asignar la receta: " + (err.message || err));
    }
  };

  // Abrir modal para asignar desde una celda vacía
  const abrirModalParaCelda = (fecha, tipo) => {
    setSelectedFecha(fecha);
    setSelectedTipo(tipo);
    setSelectedReceta(null);
    setShowModal(true);
  };

  // Obtener el rango de fechas para mostrar
  const getWeekRange = () => {
    const firstDate = new Date(fechasSemana[0]);
    const lastDate = new Date(fechasSemana[6]);
    return `${firstDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
    })} - ${lastDate.toLocaleDateString("es-ES", {
      day: "numeric",
      month: "short",
      year: "numeric",
    })}`;
  };

  return (
    <div>
      <header className="flex items-center justify-between p-4 ">
        <Menu onClick={() => setSidebarOpen(true)} className="cursor-pointer" />
        <h1 className="text-2xl font-bold">Plan semanal</h1>
        <div className="w-6" /> {/* Spacer para centrar título */}
      </header>

      {/* Navegación de semanas */}
      <div className="px-4 pb-4 flex items-center justify-between">
        <button
          onClick={() => setWeekOffset(weekOffset - 1)}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Semana anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <div className="text-center">
          <p className="font-semibold text-lg">{getWeekRange()}</p>
          {weekOffset === 0 && (
            <p className="text-sm text-gray-600">Semana actual</p>
          )}
        </div>

        <button
          onClick={() => setWeekOffset(weekOffset + 1)}
          className="p-2 rounded-full hover:bg-gray-200 transition-colors"
          aria-label="Semana siguiente"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      {/* Botón para volver a semana actual */}
      {weekOffset !== 0 && (
        <div className="px-4 pb-2 flex justify-center">
          <button
            onClick={() => setWeekOffset(0)}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            Volver a semana actual
          </button>
        </div>
      )}

      {/* Recetas sin fecha */}
      {recetasSinFecha.length > 0 && (
        <div className="p-4">
          <h2 className="font-semibold mb-2">Recetas por asignar:</h2>
          <div className="flex overflow-x-auto gap-2">
            {recetasSinFecha.map((receta) => (
              <div
                key={receta.id}
                onClick={() => {
                  setSelectedReceta(receta);
                  setSelectedFecha(fechasSemana[0]);
                  setSelectedTipo("Desayuno");
                  setShowModal(true);
                }}
                className="bg-[var(--pill-unselected-color)] p-3 rounded cursor-pointer hover:bg-blue-200"
              >
                <div className="flex flex-col items-center justify-center">
                  <p className="font-medium">{receta.name}</p>
                  {receta.tags?.length > 0 && (
                    <p className="text-sm text-gray-600">
                      {receta.tags.map((tag) => tag.name).join(", ")}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid semanal */}
      <div className="p-4 flex flex-col gap-4">
        {diasSemana.map((dia, index) => {
          const fecha = fechasSemana[index];
          return (
            <div key={dia}>
              <h3 className="font-bold mb-2 text-lg">
                {dia}, {formatFecha(fecha)}
              </h3>

              {/* Encabezados de tipos */}
              <div className="grid grid-cols-3 gap-2 mb-1">
                <p className="text-center font-semibold text-sm text-gray-600">
                  Desayuno
                </p>
                <p className="text-center font-semibold text-sm text-gray-600">
                  Comida
                </p>
                <p className="text-center font-semibold text-sm text-gray-600">
                  Cena
                </p>
              </div>

              {/* Cards de recetas */}
              <div className="grid grid-cols-3 gap-2">
                {["Desayuno", "Comida", "Cena"].map((tipo) => {
                  const receta = getRecetaFor(fecha, tipo);
                  return (
                    <div
                      key={tipo}
                      onClick={() => {
                        if (!receta) {
                          abrirModalParaCelda(fecha, tipo);
                        }
                      }}
                      className={`p-3 rounded min-h-[80px] flex flex-col items-center justify-center ${
                        receta
                          ? "bg-white shadow-sm border border-gray-200"
                          : "border border-dashed bg-gray-50 border-gray-300 cursor-pointer hover:bg-gray-100"
                      }`}
                    >
                      {receta ? (
                        <div className="flex flex-col items-center justify-center">
                          <p className="text-center font-medium">
                            {receta.name}
                          </p>
                          <div className="flex items-center  gap-1 my-1">
                            {(() => {
                              const fullStars = Math.floor(receta.rating);
                              const halfStar = receta.rating % 1 >= 0.5;

                              return (
                                <>
                                  {[...Array(fullStars)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className="w-4 h-4 text-[var(--star-color)] fill-[var(--star-color)]"
                                    />
                                  ))}
                                  {halfStar && (
                                    <StarHalf className="w-4 h-4 text-[var(--star-color)] fill-[var(--star-color)]" />
                                  )}
                                  {[
                                    ...Array(
                                      5 - fullStars - (halfStar ? 1 : 0)
                                    ),
                                  ].map((_, i) => (
                                    <Star
                                      key={i + fullStars + 1}
                                      className="w-4 h-4 text-gray-300"
                                    />
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                          {receta.tags?.length > 0 && (
                            <p className="text-center font-medium bg-[var(--tag-color)]/20 rounded text-[var(--tag-color)] px-2">
                              {receta.tags.map((tag) => tag.name).join(", ")}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Plus className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {sidebarOpen && (
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      )}

      {/* Modal para asignar receta */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
          <div className="bg-white p-6 rounded-lg w-full max-w-md shadow-xl">
            <h2 className="font-bold mb-4 text-xl">
              {selectedReceta ? selectedReceta.name : "Asignar receta"}
            </h2>

            {/* Si no hay receta seleccionada, mostrar selector */}
            {!selectedReceta && (
              <div className="mb-4">
                <label className="block font-semibold mb-2">
                  Seleccionar receta:
                </label>
                <select
                  className="w-full border rounded p-2"
                  onChange={(e) => {
                    const receta = recetas.find((r) => r.id === e.target.value);
                    setSelectedReceta(receta);
                  }}
                  defaultValue=""
                >
                  <option value="" disabled>
                    -- Elige una receta --
                  </option>
                  {recetas.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="mb-4">
              <label className="block font-semibold mb-2">Fecha:</label>
              <select
                className="w-full border rounded p-2"
                value={selectedFecha || ""}
                onChange={(e) => setSelectedFecha(e.target.value)}
              >
                <option value="" disabled>
                  -- Selecciona fecha --
                </option>
                {fechasSemana.map((f, idx) => (
                  <option key={f} value={f}>
                    {diasSemana[idx]}, {formatFecha(f)}
                  </option>
                ))}
              </select>
            </div>

            <div className="mb-6">
              <label className="block font-semibold mb-2">
                Tipo de comida:
              </label>
              <select
                className="w-full border rounded p-2"
                value={selectedTipo}
                onChange={(e) => setSelectedTipo(e.target.value)}
              >
                {["Desayuno", "Comida", "Cena"].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedReceta(null);
                  setSelectedFecha(null);
                  setSelectedTipo("Desayuno");
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Cancelar
              </button>
              <button
                onClick={asignarReceta}
                disabled={!selectedReceta}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
