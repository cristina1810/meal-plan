import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import useGlobalReducer from "../context/useGlobalReducer";
import { Star, StarHalf } from "lucide-react";

import {
  addIngredientToAllStores,
  removeIngredientFromShoppingList,
  addRecipeToWeeklyPlan,
} from "../api/api";
import { useNavigate } from "react-router-dom";

export default function RecipeCard({ recipe }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { store, dispatch } = useGlobalReducer();
  const [loading, setLoading] = useState(false);
  const inPlan = store.weeklyPlan.some((p) => p.recipe_id === recipe.id);
  const handleAddIngredient = async (ingredient) => {
    if (!user?.id) {
      alert("Debes iniciar sesión para gestionar la lista de compra.");
      return;
    }
    setLoading(true);
    try {
      const inList = store.shoppingList.includes(ingredient.id);
      if (inList) {
        await removeIngredientFromShoppingList(user.id, ingredient.id);
        dispatch({ type: "REMOVE_FROM_SHOPPING_LIST", payload: ingredient.id });
        alert(
          `Ingrediente "${ingredient.name}" eliminado de la lista de la compra.`
        );
      } else {
        const inserted = await addIngredientToAllStores(ingredient.id, user.id);
        dispatch({ type: "ADD_TO_SHOPPING_LIST", payload: ingredient.id });
        alert(
          `Ingrediente "${ingredient.name}" añadido a ${inserted.length} tienda(s).`
        );
      }
    } catch (err) {
      console.error(err);
      alert("Error: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };
  const handleAddToWeeklyPlan = async (e) => {
    e.stopPropagation();
    if (!user?.id) {
      alert("Debes iniciar sesión para añadir recetas al plan semanal.");
      return;
    }
    setLoading(true);
    try {
      // 1️⃣ Añadir receta al plan semanal
      await addRecipeToWeeklyPlan(user.id, recipe.id);

      // 2️⃣ Añadir automáticamente los ingredientes "Urgente" a todas las listas
      const urgentIngredients = recipe.ingredients.filter(
        (i) => i.status === "Urgente"
      );

      for (let ingredient of urgentIngredients) {
        const inList = store.shoppingList.includes(ingredient.id);
        if (!inList) {
          await addIngredientToAllStores(ingredient.id, user.id);
          dispatch({ type: "ADD_TO_SHOPPING_LIST", payload: ingredient.id });
        }
      }

      alert(
        `Receta "${recipe.name}" añadida al plan semanal y ${urgentIngredients.length} ingrediente(s) urgente(s) añadido(s) automáticamente a la lista.`
      );
    } catch (err) {
      console.error(err);
      alert("Error al añadir al plan semanal: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };
  const handleAddAllIngredients = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      for (let ingredient of recipe.ingredients) {
        const inList = store.shoppingList.includes(ingredient.id);
        if (!inList) {
          await addIngredientToAllStores(ingredient.id, user.id);
          dispatch({ type: "ADD_TO_SHOPPING_LIST", payload: ingredient.id });
        }
      }
      alert("Todos los ingredientes añadidos a la lista de compra.");
    } catch (err) {
      console.error(err);
      alert("Error añadiendo todos los ingredientes: " + (err.message ?? err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-white p-4 rounded shadow-md"
      onClick={() => navigate(`/recipe/${recipe.id}`)}
    >
      <div className="flex justify-between items-center">
        <h3 className="font-bold text-lg">{recipe.name}</h3>
        <div className="flex items-center gap-1">
          {(() => {
            const fullStars = Math.floor(recipe.rating);
            const halfStar = recipe.rating % 1 >= 0.5;

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
                {[...Array(5 - fullStars - (halfStar ? 1 : 0))].map((_, i) => (
                  <Star
                    key={i + fullStars + 1}
                    className="w-4 h-4 text-gray-300"
                  />
                ))}
              </>
            );
          })()}
        </div>
      </div>
      {recipe.tags.length > 0 ? (
        recipe.tags.map((tag) => (
          <div
            key={tag.id}
            className="flex flex-wrap inline-flex items-center mt-2 gap-2 mx-1 "
          >
            <span className="px-2.5 py-0.5 bg-[var(--pill-unselected-color)]/50 border-[var(--pill-unselected-color)] text-gray-400 font-medium rounded-full">
              {tag.name}
            </span>
          </div>
        ))
      ) : (
        <span className="text-gray-400 text-xs">Sin tags</span>
      )}
      <div className="mt-2">
        <h4 className="font-semibold">Ingredientes:</h4>
        {recipe.ingredients?.map((ingredient) => {
          const inList = store.shoppingList.includes(ingredient.id);
          return (
            <div
              key={ingredient.id}
              className="flex flex-wrap inline-flex items-center mt-2 gap-2 mx-1 "
            >
              <span
                className={`font-medium px-2.5 rounded-full ${
                  ingredient.status === "Disponible"
                    ? "text-[var(--available)] bg-[var(--available)]/20"
                    : ingredient.status === "Faltante"
                    ? "text-[var(--faltante)] bg-[var(--faltante)]/20"
                    : ingredient.status === "Urgente"
                    ? "text-[var(--urgente)] bg-[var(--urgente)]/20"
                    : "text-gray-500 bg-[var(--pill-unselected-color)]/20"
                }`}
              >
                {ingredient.name}
              </span>
            </div>
          );
        })}
      </div>

      <button
        onClick={handleAddToWeeklyPlan}
        disabled={loading}
        className="mt-3 px-4 py-2 bg-[var(--button-color)] w-full font-medium text-white rounded hover:bg-[var(--button-added-color)]"
      >
        Añadir al plan semanal
      </button>
    </div>
  );
}
