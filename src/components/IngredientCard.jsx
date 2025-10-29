// src/components/IngredientCard.jsx
import React, { useState } from "react";
import useGlobalReducer from "../context/useGlobalReducer";
import { addIngredientToAllLists } from "../api/shoppingLists";

export default function IngredientCard({ ingredient }) {
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(false);

  const handleAddToAll = async () => {
    if (!store.user)
      return alert("Inicia sesión para usar listas de la compra.");
    setLoading(true);
    try {
      const inserted = await addIngredientToAllLists(
        store.user.id,
        ingredient.id,
        { quantity: 1, unit: "u" }
      );
      // Opcional: re-fetch shopping lists o actualizar localmente
      dispatch({ type: "SET_INGREDIENTS", payload: inserted });
      alert(`Añadido a ${inserted.length} listas.`);
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <article
      className="ingredient-card"
      style={{ border: "1px solid #ddd", padding: 12, borderRadius: 6 }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h4 style={{ margin: 0 }}>{ingredient.name}</h4>
          <small>
            {ingredient.brand ?? ""} •{" "}
            {Array.isArray(ingredient.type)
              ? ingredient.type.join(", ")
              : ingredient.type}
          </small>
        </div>
        <div>
          <button onClick={handleAddToAll} disabled={loading}>
            {loading ? "Añadiendo..." : "Añadir a todas las listas"}
          </button>
        </div>
      </div>
    </article>
  );
}
