// src/pages/Recipe.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getRecipeById } from "../api/api";
import { Star, StarHalf } from "lucide-react";
import RecipeForm from "../components/RecipeForm";
import { Menu, Pencil } from "lucide-react";
import Sidebar from "../components/Sidebar";

const Recipe = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkedItems, setCheckedItems] = useState({});
  const [showEditForm, setShowEditForm] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
      <div className="flex items-center gap-2 p-4 sticky top-0 bg-[var(--bg-light)]/80 backdrop-blur-sm justify-between">
        <Menu onClick={() => setSidebarOpen(true)} />
        <div className="flex items-center flex-col justify-center gap-2">
          <h1 className="text-2xl font-bold">{recipe.name}</h1>
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
        <button onClick={() => setShowEditForm(true)} className="">
          <Pencil className="w-5 h-5" />
        </button>
      </div>
      <div className="p-4 max-w-3xl mt-5 bg-white mx-4 rounded shadow">
        <div className="flex items-center gap-2">
          <div className="mb-2 flex gap-2 flex-wrap">
            {recipe.tags?.length > 0 && (
              <p className="text-gray-600 bg-gray-200 px-3 rounded">
                {recipe.tags.map((t) => t.name).join(", ")}
              </p>
            )}
          </div>
          <p className="mb-2 ms-auto">{recipe.type || "Sin categoría"}</p>
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
                  <span className="font-semibold">{i.name}</span> {i.quantity}{" "}
                  {i.unit}
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
                <label key={idx} className="flex items-start  gap-2">
                  <input
                    className="mt-1.5"
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
      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}
    </>
  );
};

export default Recipe;
