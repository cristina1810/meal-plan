// src/pages/Recipe.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecipeById } from "../api/api";
import { Star, StarHalf } from "lucide-react";
import RecipeForm from "../components/RecipeForm";

const Recipe = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});
  const [showEditForm, setShowEditForm] = useState(false);

  const loadRecipe = async () => {
    setLoading(true);
    try {
      const data = await getRecipeById(id);
      setRecipe(data);
    } catch (err) {
      console.error("Error cargando receta:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || !id) return;
    loadRecipe();
  }, [user, id]);

  const handleCloseEdit = () => {
    setShowEditForm(false);
    loadRecipe(); // Recargar la receta después de editar
  };

  if (!user) return <p>Cargando usuario...</p>;
  if (loading) return <p>Cargando receta...</p>;
  if (!recipe) return <p>No se encontró la receta.</p>;

  return (
    <>
      <div className="p-4 max-w-3xl mx-auto border rounded shadow">
        <div className="mb-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold">{recipe.name}</h1>

          <button
            onClick={() => setShowEditForm(true)}
            className="bg-[var(--button-color)] text-white px-4 py-2 rounded hover:bg-[var(--button-added-color)]"
          >
            Editar
          </button>
        </div>
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
        <p className="mb-2">{recipe.type || "Sin categoría"}</p>
        <div className="mb-4 flex gap-2">
          {recipe.tags?.length > 0 && (
            <p className="text-gray-600 bg-gray-200 px-3 rounded">
              {recipe.tags.map((t) => t.name).join(", ")}
            </p>
          )}
        </div>
        <h2 className="text-2xl font-semibold mb-2">Ingredientes</h2>
        <div className="mb-4">
          {recipe.ingredients.map((i) => {
            const key = `ingredient-${i.id}`;
            return (
              <label key={i.id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!checkedItems[key]}
                  onChange={() =>
                    setCheckedItems((prev) => ({
                      ...prev,
                      [key]: !prev[key],
                    }))
                  }
                />
                <span
                  className={
                    checkedItems[key] ? "line-through text-gray-400" : ""
                  }
                >
                  {i.name} {i.quantity} {i.unit}
                </span>
              </label>
            );
          })}
        </div>

        <h2 className="text-2xl font-semibold mb-2">Instrucciones</h2>
        {(recipe.recipe_steps?.length ?? 0) > 0 ? (
          <div className="">
            {recipe.recipe_steps.map((step, idx) => {
              const key = `step-${idx}`;
              return (
                <label key={idx} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!checkedItems[key]}
                    onChange={() =>
                      setCheckedItems((prev) => ({
                        ...prev,
                        [key]: !prev[key],
                      }))
                    }
                  />
                  <span
                    className={
                      checkedItems[key] ? "line-through text-gray-400" : ""
                    }
                  >
                    {step.text}
                  </span>
                </label>
              );
            })}
          </div>
        ) : (
          <p>No hay pasos para esta receta.</p>
        )}
      </div>

      {showEditForm && (
        <RecipeForm recipeToEdit={recipe} onClose={handleCloseEdit} />
      )}
    </>
  );
};

export default Recipe;
