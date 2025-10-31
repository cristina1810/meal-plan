import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import useGlobalReducer from "../context/useGlobalReducer";
import { TIPOS_RECETA } from "../constants";
import {
  fetchIngredients,
  fetchTags,
  createRecipe,
  updateRecipe,
} from "../api/api";
import { Plus, Trash2, MoveUp, MoveDown, X, Star, Minus } from "lucide-react";

const RecipeForm = ({ onClose, recipeToEdit = null }) => {
  const { user } = useAuth();
  const { dispatch } = useGlobalReducer();
  const isEditing = !!recipeToEdit;

  // Form state
  const [name, setName] = useState(recipeToEdit?.name || "");
  const [type, setType] = useState(recipeToEdit?.type || TIPOS_RECETA[0]);
  const [rating, setRating] = useState(recipeToEdit?.rating || "");
  const [instructions, setInstructions] = useState(
    recipeToEdit?.instructions || ""
  );

  // Ingredientes
  const [ingredientName, setIngredientName] = useState("");
  const [ingredientQuantity, setIngredientQuantity] = useState("");
  const [ingredientUnit, setIngredientUnit] = useState("");
  const [ingredients, setIngredients] = useState(
    recipeToEdit?.ingredients || []
  );

  // Tags
  const [tagName, setTagName] = useState("");
  const [tags, setTags] = useState(
    recipeToEdit?.tags?.map((t) =>
      typeof t === "string" ? { id: crypto.randomUUID(), name: t } : t
    ) || []
  );

  // Pasos
  const [currentStepText, setCurrentStepText] = useState("");
  const [steps, setSteps] = useState([]);

  // Autocompletado
  const [allIngredients, setAllIngredients] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
  const [tagSuggestions, setTagSuggestions] = useState([]);

  // Cargar datos para autocompletado
  useEffect(() => {
    const loadData = async () => {
      try {
        const ing = await fetchIngredients();
        setAllIngredients(
          ing.filter((i) => i.name).map((i) => ({ id: i.id, name: i.name }))
        );

        const tg = await fetchTags();
        setAllTags(
          tg.filter((t) => t.name).map((t) => ({ id: t.id, name: t.name }))
        );
      } catch (err) {
        console.error("Error cargando ingredientes/tags:", err);
      }
    };
    loadData();
  }, []);

  // Filtrar sugerencias mientras escribes
  useEffect(() => {
    if (ingredientName.length > 0) {
      setIngredientSuggestions(
        allIngredients.filter((i) =>
          i.name.toLowerCase().includes(ingredientName.toLowerCase())
        )
      );
    } else setIngredientSuggestions([]);
  }, [ingredientName, allIngredients]);

  useEffect(() => {
    if (tagName.length > 0) {
      setTagSuggestions(
        allTags
          .filter((t) => t.name.toLowerCase().includes(tagName.toLowerCase()))
          .filter((t) => !tags.some((tag) => tag.name === t.name))
      );
    } else {
      setTagSuggestions([]);
    }
  }, [tagName, allTags, tags]);

  // Añadir ingrediente
  const handleAddIngredient = (e) => {
    e.preventDefault();
    if (!ingredientName) return;

    const existing = allIngredients.find((i) => i.name === ingredientName);
    if (ingredients.some((i) => i.name === ingredientName)) return;

    setIngredients([
      ...ingredients,
      {
        id: existing ? existing.id : crypto.randomUUID(),
        name: ingredientName,
        quantity: ingredientQuantity,
        unit: ingredientUnit,
      },
    ]);

    setIngredientName("");
    setIngredientQuantity("");
    setIngredientUnit("");
    setIngredientSuggestions([]);
  };

  // Seleccionar sugerencia de ingrediente
  const selectIngredientSuggestion = (name) => {
    setIngredientName(name);
    setIngredientSuggestions([]);
  };

  // Añadir tag
  const handleAddTag = (e) => {
    e.preventDefault();
    if (!tagName.trim()) return;

    const existing = allTags.find((t) => t.name === tagName.trim());
    if (tags.some((t) => t.name === tagName.trim())) return;

    setTags([
      ...tags,
      {
        id: existing ? existing.id : crypto.randomUUID(),
        name: tagName.trim(),
      },
    ]);

    setTagName("");
    setTagSuggestions([]);
  };

  // Seleccionar sugerencia de tag
  const selectTagSuggestion = (name) => {
    setTagName(name);
    setTagSuggestions([]);
  };

  // -------------------- FUNCIONES PARA PASOS --------------------
  const handleAddStep = (e) => {
    e.preventDefault();
    if (!currentStepText.trim()) {
      alert("Por favor, escribe un paso antes de añadir");
      return;
    }

    const newStep = {
      num: steps.length + 1,
      text: currentStepText.trim(),
      tempId: Date.now(),
    };

    setSteps([...steps, newStep]);
    setCurrentStepText("");
  };

  const handleDeleteStep = (tempId) => {
    const updatedSteps = steps
      .filter((s) => s.tempId !== tempId)
      .map((s, index) => ({ ...s, num: index + 1 }));
    setSteps(updatedSteps);
  };

  const handleUpdateStep = (tempId, newText) => {
    setSteps(
      steps.map((s) => (s.tempId === tempId ? { ...s, text: newText } : s))
    );
  };

  const moveStep = (index, direction) => {
    const newSteps = [...steps];
    const targetIndex = direction === "up" ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= steps.length) return;

    [newSteps[index], newSteps[targetIndex]] = [
      newSteps[targetIndex],
      newSteps[index],
    ];

    const reordered = newSteps.map((s, i) => ({ ...s, num: i + 1 }));
    setSteps(reordered);
  };

  // Guardar receta
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !type) return;

    const recipeData = {
      name,
      type,
      rating: Number(rating) || null,
      instructions,
      ingredients: ingredients.map((i) => ({
        id: i.id,
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
      })),
      tags: tags.map((t) => t.name),
      steps: steps.map((s) => s.text),
      user_id: user.id,
    };

    try {
      if (isEditing) {
        const updated = await updateRecipe(recipeToEdit.id, recipeData);
        dispatch({ type: "UPDATE_RECIPE", payload: updated });
      } else {
        const created = await createRecipe(recipeData);
        dispatch({ type: "ADD_RECIPE", payload: created });
      }
      onClose?.();
    } catch (err) {
      console.error("Error guardando la receta:", err);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-xl w-full max-w-md flex flex-col gap-4 p-6 shadow-xl bg-white">
        {/* Header */}
        <h1 className="text-2xl font-bold text-center">
          {isEditing ? "Editar Receta" : "Nueva Receta"}
        </h1>

        <div className=" space-y-4">
          {/* Información básica */}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Nombre de la receta"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <div className="flex gap-2 items-center justify-between ">
              <div className="grid grid-cols-2 gap-2">
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  className="border py-1 bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {TIPOS_RECETA.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>

                <div className="flex gap-1 mt-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star
                      key={n}
                      className={`w-6 h-6 cursor-pointer ${
                        rating >= n
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-gray-300"
                      }`}
                      onClick={() => setRating(n)}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Ingredientes */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Ingredientes</h3>

            {ingredients.length > 0 && (
              <div className="space-y-1">
                {ingredients.map((i) => (
                  <div
                    key={i.id}
                    className="flex gap-2 items-center bg-gray-50 px-2 py-1.5 rounded text-sm"
                  >
                    <span className="flex-1">{i.name}</span>
                    <span className="text-gray-600 text-xs">
                      {i.quantity} {i.unit}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setIngredients(
                          ingredients.filter((ing) => ing.id !== i.id)
                        )
                      }
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-1.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Ingrediente"
                  value={ingredientName}
                  onChange={(e) => setIngredientName(e.target.value)}
                  className="w-full border rounded-full bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {ingredientSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto z-50">
                    {ingredientSuggestions.map((i) => (
                      <li
                        key={i.id}
                        className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100"
                        onClick={() => selectIngredientSuggestion(i.name)}
                      >
                        {i.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <input
                type="text"
                placeholder="Cant."
                value={ingredientQuantity}
                onChange={(e) => setIngredientQuantity(e.target.value)}
                className="w-16 border rounded-full bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="text"
                placeholder="Un."
                value={ingredientUnit}
                onChange={(e) => setIngredientUnit(e.target.value)}
                className="w-14 border rounded-full bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleAddIngredient}
                className="bg-[var(--button-color)] text-white px-2 rounded-full hover:bg-[var(--button-color-hover)]"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Etiquetas</h3>

            {tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {tags.map((t) => (
                  <span
                    key={t.id}
                    className="bg-[var(--tag-color)]/20 text-[var(--tag-color)] px-2 py-1 rounded text-xs flex items-center gap-1"
                  >
                    {t.name}
                    <button
                      type="button"
                      onClick={() =>
                        setTags(tags.filter((tag) => tag.id !== t.id))
                      }
                      className="hover:text-red-600 "
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="flex gap-1.5">
              <div className="flex-1 relative">
                <input
                  type="text"
                  placeholder="Nueva etiqueta"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  className="w-full border rounded-full bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {tagSuggestions.length > 0 && (
                  <ul className="absolute top-full left-0 right-0 mt-1 bg-white border rounded shadow-lg max-h-32 overflow-auto z-50">
                    {tagSuggestions.map((t) => (
                      <li
                        key={t.id}
                        className="px-2 py-1.5 text-sm cursor-pointer hover:bg-gray-100"
                        onClick={() => selectTagSuggestion(t.name)}
                      >
                        {t.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <button
                onClick={handleAddTag}
                className="bg-[var(--button-color)] text-white px-2 rounded-full hover:bg-blue-600"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Pasos */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-gray-700">Pasos</h3>

            {steps.length > 0 && (
              <div className="space-y-2">
                {steps.map((step, index) => (
                  <div
                    key={step.tempId}
                    className="flex gap-2 items-start bg-gray-50 p-2 rounded"
                  >
                    <div className="flex flex-col gap-0.5 pt-1">
                      <button
                        type="button"
                        onClick={() => moveStep(index, "up")}
                        disabled={index === 0}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-20"
                      >
                        <MoveUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => moveStep(index, "down")}
                        disabled={index === steps.length - 1}
                        className="text-gray-400 hover:text-gray-600 disabled:opacity-20"
                      >
                        <MoveDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <span className="font-medium text-gray-600 text-sm min-w-[1.5rem] pt-1.5">
                      {step.num}.
                    </span>

                    <textarea
                      value={step.text}
                      onChange={(e) =>
                        handleUpdateStep(step.tempId, e.target.value)
                      }
                      className="flex-1 border rounded bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium px-2 py-1.5 text-sm min-h-[48px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />

                    <button
                      type="button"
                      onClick={() => handleDeleteStep(step.tempId)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex gap-2 items-start rounded ">
              <span className="font-medium text-gray-600 text-sm min-w-[1.5rem] pt-1.5">
                {steps.length + 1}.
              </span>
              <textarea
                value={currentStepText}
                onChange={(e) => setCurrentStepText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && e.ctrlKey) {
                    handleAddStep(e);
                  }
                }}
                className="flex-1 border rounded bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-400 placeholder:font-medium px-2 py-1.5 text-sm min-h-[48px] resize-y focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Escribe el siguiente paso..."
              />
              <button
                type="button"
                onClick={handleAddStep}
                disabled={!currentStepText.trim()}
                className="bg-[var(--button-color)] text-white p-1.5 rounded-full hover:bg-blue-600 disabled:bg-gray-300"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Botones */}
          <div className="flex gap-2 pt-2 ">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-lg font-bold bg-[var(--button-added-color)] text-white hover:bg-opacity-80"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="flex-1 py-3 px-4 rounded-lg font-bold bg-[var(--button-color)]/30 text-[var(--button-color)] hover:bg-opacity-90"
            >
              {isEditing ? "Actualizar" : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipeForm;
