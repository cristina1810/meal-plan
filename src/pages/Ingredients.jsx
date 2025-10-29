// src/pages/Ingredients.jsx
import React, { useEffect } from "react";
import { fetchIngredients } from "../api/ingredients";
import useGlobalReducer from "../context/useGlobalReducer";
import IngredientCard from "../components/IngredientCard";

export default function Ingredients() {
  const { store, dispatch } = useGlobalReducer();

  useEffect(() => {
    let mounted = true;
    async function load() {
      dispatch({ type: "SET_LOADING", payload: true });
      try {
        const data = await fetchIngredients();
        if (!mounted) return;
        dispatch({ type: "SET_INGREDIENTS", payload: data });
      } catch (err) {
        console.error(err);
        dispatch({ type: "SET_ERROR", payload: err.message ?? String(err) });
      } finally {
        if (mounted) dispatch({ type: "SET_LOADING", payload: false });
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [dispatch]);

  return (
    <main style={{ padding: 16 }}>
      <h2>Ingredientes</h2>

      {store.loading && <p>Cargando...</p>}
      {store.error && <p style={{ color: "red" }}>{store.error}</p>}

      <section style={{ display: "grid", gap: 12 }}>
        {store.ingredients?.length === 0 && !store.loading ? (
          <p>No hay ingredientes.</p>
        ) : (
          store.ingredients.map((i) => (
            <IngredientCard key={i.id} ingredient={i} />
          ))
        )}
      </section>
    </main>
  );
}
