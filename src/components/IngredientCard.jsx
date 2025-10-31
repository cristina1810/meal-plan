import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import useGlobalReducer from "../context/useGlobalReducer";
import {
  addIngredientToAllStores,
  removeIngredientFromShoppingList,
  fetchUserShoppingList,
  fetchStores,
  updateIngrediente,
  deleteIngredient,
} from "../api/api";
import {
  Star,
  StarHalf,
  Plus,
  ShoppingBasket,
  Check,
  Trash,
} from "lucide-react";
import { useSwipeable } from "react-swipeable";

export default function IngredientCard({
  ingredient: initialIngredient,
  onEdit,
}) {
  const { user } = useAuth();
  const { store, dispatch } = useGlobalReducer();
  const [showDelete, setShowDelete] = useState(false);

  // --- Estados locales ---
  const [ingredient, setIngredient] = useState(initialIngredient);
  const [loading, setLoading] = useState(false);
  const [showPrices, setShowPrices] = useState(false);
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setShowDelete(true),
    onSwipedRight: () => setShowDelete(false),
    preventDefaultTouchmoveEvent: true,
    trackMouse: true, // también permite swipe con ratón
  });

  // --- Inicializar ingrediente si cambian los props ---
  useEffect(() => {
    setIngredient(initialIngredient);
  }, [initialIngredient]);

  // --- Lista de la compra ---
  const inShoppingList = store.shoppingList?.includes(ingredient.id) ?? false;

  useEffect(() => {
    async function loadShoppingList() {
      if (!user?.id) return;
      try {
        const list = await fetchUserShoppingList(user.id);
        dispatch({ type: "SET_SHOPPING_LIST", payload: list });
      } catch (err) {
        console.error("Error cargando shopping_list:", err);
      }
    }
    loadShoppingList();
  }, [user, dispatch]);

  // --- Tiendas ---
  useEffect(() => {
    async function loadStores() {
      if (store.stores.length === 0) {
        try {
          const stores = await fetchStores();
          dispatch({ type: "SET_STORES", payload: stores });
        } catch (err) {
          console.error("Error cargando tiendas:", err);
        }
      }
    }
    loadStores();
  }, [store.stores, dispatch]);

  // --- Manejar añadir/eliminar de la lista de compra ---
  const handleButtonClick = async (e) => {
    e.stopPropagation();
    if (!user?.id) {
      alert("Debes iniciar sesión para gestionar la lista de compra.");
      return;
    }

    setLoading(true);
    try {
      if (inShoppingList) {
        await removeIngredientFromShoppingList(user.id, ingredient.id);
        dispatch({ type: "REMOVE_FROM_SHOPPING_LIST", payload: ingredient.id });
      } else {
        const inserted = await addIngredientToAllStores(ingredient.id, user.id);
        dispatch({ type: "ADD_TO_SHOPPING_LIST", payload: ingredient.id });
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  // --- Manejar cambios de estado ---
  const handleStatusChange = async (e) => {
    const newStatus = e.target.value;
    setIngredient((prev) => ({ ...prev, status: newStatus }));
    try {
      await updateIngrediente(ingredient.id, { status: newStatus });
      dispatch({
        type: "UPDATE_INGREDIENT",
        payload: { id: ingredient.id, updates: { status: newStatus } },
      });
    } catch (err) {
      console.error("Error actualizando estado:", err);
    }
  };

  // --- Manejar tienda favorita ---
  const handleFavoriteChange = async (e) => {
    const storeId = e.target.value || null;
    setIngredient((prev) => ({
      ...prev,
      favorite_store: store.stores.find((s) => s.id === storeId) || null,
    }));
    try {
      const updated = await updateIngrediente(ingredient.id, {
        favorite_store: storeId,
      });
      dispatch({
        type: "UPDATE_INGREDIENT",
        payload: { id: ingredient.id, updates: updated },
      });
    } catch (err) {
      console.error("Error actualizando tienda favorita:", err);
    }
  };
  // --- Manejar eliminación del ingrediente ---
  const handleDelete = async (ingredient) => {
    if (!user?.id) {
      alert("Debes iniciar sesión para eliminar un ingrediente.");
      return;
    }

    const confirmDelete = confirm(
      `¿Estás segura de que quieres eliminar "${ingredient.name}"?`
    );
    if (!confirmDelete) return;

    try {
      setLoading(true);

      // 1️⃣ Eliminar de la lista de compra del usuario
      await removeIngredientFromShoppingList(user.id, ingredient.id);

      // 2️⃣ Eliminar de la base de datos
      await deleteIngredient(ingredient.id);

      // 3️⃣ Actualizar el estado local
      dispatch({ type: "REMOVE_FROM_SHOPPING_LIST", payload: ingredient.id });
      dispatch({
        type: "SET_INGREDIENTS",
        payload: store.ingredients.filter((i) => i.id !== ingredient.id),
      });

      alert(`"${ingredient.name}" ha sido eliminado completamente.`);
    } catch (err) {
      console.error("Error eliminando ingrediente:", err);
      alert("Error eliminando el ingrediente: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  // --- Precio mínimo ---
  const availablePrices = ingredient.ingredient_prices?.filter(
    (p) => p.available !== false && p.price != null
  );
  const minPrice = availablePrices?.length
    ? Math.min(...availablePrices.map((p) => p.price))
    : null;

  return (
    <div {...swipeHandlers} className="relative">
      {/* Botón de borrar */}
      {showDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(ingredient);
          }}
          className="absolute right-0 top-0 bottom-0 bg-red-500 text-white px-5 font-bold m-2 rounded"
        >
          <Trash className="w-5 h-5" />
        </button>
      )}
      <div
        className={`bg-white p-4 rounded shadow-md  my-2 transition-transform duration-300 ease-out animate-slideIn ${
          showDelete ? "translate-x-[-80px]" : ""
        }`}
        onClick={(e) => {
          // Evita abrir el formulario al pulsar botones o selects dentro de la card
          const tag = e.target.tagName;
          if (["SELECT", "BUTTON", "OPTION"].includes(tag)) return;
          onEdit?.(ingredient); // Llama a la función pasada por props
        }}
      >
        {/* NOMBRE, MARCA Y VALORACIÓN */}
        <div className="flex justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-semibold">{ingredient.name}</h3>
            <p className="text-base text-gray-500 font-medium">
              {ingredient.brand?.name ?? "Sin marca"}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {(() => {
              const fullStars = Math.floor(ingredient.rating);
              const halfStar = ingredient.rating % 1 >= 0.5;

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
                  {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map(
                    (_, i) => (
                      <Star
                        key={i + fullStars + 1}
                        className="w-4 h-4 text-gray-300"
                      />
                    )
                  )}
                </>
              );
            })()}
          </div>
        </div>
        {/* ESTADO Y TIENDA FAVORITA */}
        <div className="flex justify-between mt-2 gap-2">
          <select
            value={ingredient.status}
            onChange={handleStatusChange}
            className={`border-none outline-none appearance-none rounded px-2  [text-align-last:center] ${
              ingredient.status === "Disponible"
                ? "bg-[var(--available)]/20 text-[var(--available)]"
                : ingredient.status === "Faltante"
                ? "bg-[var(--faltante)]/20 text-[var(--faltante)]"
                : ingredient.status === "Urgente"
                ? "bg-[var(--urgente)]/20 text-[var(--urgente)]"
                : ""
            }`}
          >
            <option value="">Sin estado</option>
            <option value="Disponible">Disponible</option>
            <option value="Faltante">Faltante</option>
            <option value="Urgente">Urgente</option>
          </select>

          <select
            value={ingredient.favorite_store?.id || ""}
            onChange={handleFavoriteChange}
            style={{ width: "auto" }}
            className="w-auto border-none outline-none appearance-none rounded [text-align-last:center] bg-[var(--favorite-store-color)]/20 text-[var(--text-favorite-store-color)] "
          >
            <option value="">Sin tienda favorita</option>
            {store.stores?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        {/* PRECIOS */}
        {ingredient.ingredient_prices?.length > 0 && (
          <div className="mt-2">
            {showPrices && (
              <ul className="flex flex-col gap-1">
                <p className="text-center font-semibold">Precios</p>
                {ingredient.ingredient_prices.map((p) => {
                  const isMin = p.price === minPrice && p.available;
                  return (
                    <li
                      key={p.id}
                      className={`flex justify-between items-center p-1 rounded-sm px-2 ${
                        isMin
                          ? "font-bold bg-[var(--price-min-color)]/20 text-[var(--price-min-color)]"
                          : ""
                      }`}
                    >
                      <span>{p.store?.name || "Tienda desconocida"}</span>
                      <span>
                        {p.price != null && p.price !== 0 ? `${p.price} €` : ""}{" "}
                        <span className="text-gray-500 font-medium">
                          {p.available === false && "No disponible"}
                        </span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
            <div className="flex items-center gap-2 justify-between mt-2">
              <button
                className="px-3 py-1 font-medium"
                onClick={() => setShowPrices(!showPrices)}
              >
                {showPrices ? "Ocultar precios" : "Mostrar precios"}
              </button>

              <button
                onClick={handleButtonClick}
                disabled={loading}
                className={`text-white border-none py-2 px-4 rounded cursor-pointer transition-colors duration-200 ${
                  loading ? "bg-gray-400 cursor-not-allowed opacity-60" : ""
                } ${
                  inShoppingList
                    ? "bg-[var(--button-added-color)] hover:bg-[var(--button-added-color)]"
                    : "bg-[var(--button-color)] hover:bg-[var(--button-added-color)]"
                }`}
              >
                {loading ? (
                  "Procesando..."
                ) : inShoppingList ? (
                  <div className="flex items-center gap-2 font-medium">
                    <Check className="w-4 h-4" strokeWidth={1.5} />
                    Añadido
                  </div>
                ) : (
                  <div className="flex items-center gap-2 font-medium">
                    <ShoppingBasket className="w-4 h-4" strokeWidth={1.5} />
                    Añadir
                  </div>
                )}
              </button>
            </div>
          </div>
        )}
        {ingredient.ingredient_prices?.length === 0 && (
          <p>Sin precios registrados</p>
        )}
      </div>
    </div>
  );
}
