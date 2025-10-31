// src/api/api.js
import { supabase } from "./supabaseClient";

/** ------------------ INGREDIENTES ------------------ */

export async function fetchIngredients() {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  console.log("Sesión actual:", session ? "Activa" : "No activa");

  const { data, error } = await supabase
    .from("ingredients")
    .select(
      `
      *,
      brand:brand_id(id, name),
      favorite_store:favorite_store(id, name),
      ingredient_prices(
        id,
        price,
        available,
        store:store_id(id, name)
      )
    `
    )
    .order("name", { ascending: true });

  if (error) {
    console.error("Error detallado:", error);
    throw error;
  }

  return data || [];
}

export async function createIngredient(payload, user_id) {
  const { data, error } = await supabase
    .from("ingredients")
    .insert([{ ...payload, user_id }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function getIngredientById(id) {
  const { data, error } = await supabase
    .from("ingredients")
    .select(
      `
      *,
      brand:brand_id(id, name),
      favorite_store:favorite_store(id, name),
      ingredient_prices(
        id,
        price,
        available,
        store:store_id(id, name)
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}

export async function updateIngrediente(id, payload) {
  const { data, error } = await supabase
    .from("ingredients")
    .update(payload)
    .eq("id", id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function getRecipeById(id) {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients (
        ingredient:ingredient_id (
          id,
          name,
          type,
          rating,
          status,
          brand:brand_id(name),
          favorite_store:favorite_store(id, name)
        ),
        quantity,
        unit
      ),
      recipe_tags (
        tag:tag_id (
          id,
          name
        )
      ),
      recipe_steps(*)
    `
    )
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching recipe by ID:", error);
    return null;
  }
  if (!data) return null;

  console.log("DATA RAW:", data, "ERROR:", error);

  // Transformar para que sea más fácil de usar
  return {
    ...data,
    ingredients:
      data.recipe_ingredients?.map((i) => ({
        ...i.ingredient,
        quantity: i.quantity,
        unit: i.unit,
      })) || [],
    tags: data.recipe_tags?.map((rt) => rt.tag) || [],
    // Asegúrate de que recipe_steps sea un array y esté ordenado
    recipe_steps: (data.recipe_steps || []).sort((a, b) => a.num - b.num),
  };
}
// Añade estas funciones a tu archivo api.js

/**
 * Crear un paso para una receta
 */
export async function createRecipeStep({ recipe_id, num, text }) {
  const { data, error } = await supabase
    .from("recipe_steps")
    .insert([{ recipe_id, num, text }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Obtener todos los pasos de una receta ordenados por número
 */
export async function fetchRecipeSteps(recipeId) {
  const { data, error } = await supabase
    .from("recipe_steps")
    .select("*")
    .eq("recipe_id", recipeId)
    .order("num", { ascending: true });

  if (error) throw error;
  return data || [];
}

/**
 * Actualizar un paso existente
 */
export async function updateRecipeStep(stepId, text) {
  const { data, error } = await supabase
    .from("recipe_steps")
    .update({ text })
    .eq("id", stepId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Eliminar un paso
 */
export async function deleteRecipeStep(stepId) {
  const { data, error } = await supabase
    .from("recipe_steps")
    .delete()
    .eq("id", stepId);

  if (error) throw error;
  return data;
}

/**
 * Crear múltiples pasos a la vez (útil al crear una receta)
 */
export async function createMultipleRecipeSteps(recipeId, steps) {
  const stepsData = steps.map((text, index) => ({
    recipe_id: recipeId,
    num: index + 1,
    text: text,
  }));

  const { data, error } = await supabase
    .from("recipe_steps")
    .insert(stepsData)
    .select();

  if (error) throw error;
  return data;
}
/** ------------------ LISTAS DE COMPRA ------------------ */

/**
 * Añade un ingrediente a la lista de compra de un usuario para una tienda específica
 * solo si no hay un registro en ingredient_prices con available = false
 */
export async function addIngredientToShoppingList({
  userId,
  ingredientId,
  storeId,
  amount,
  price,
}) {
  const { data: priceRecords, error: priceError } = await supabase
    .from("ingredient_prices")
    .select("available")
    .eq("ingredient_id", ingredientId)
    .eq("store_id", storeId);

  if (priceError) throw priceError;

  const hasUnavailable = priceRecords?.some((p) => p.available === false);
  if (hasUnavailable) return null;

  const { data, error } = await supabase.from("shopping_lists").insert([
    {
      user_id: userId,
      ingredient_id: ingredientId,
      store_id: storeId,
      amount,
      price,
    },
  ]);

  if (error) throw error;

  return data;
}

// Reemplaza tu función createRecipe actual con esta versión actualizada

// Reemplaza tu función createRecipe actual con esta versión actualizada

export async function createRecipe(payload) {
  const {
    name,
    type,
    rating,
    instructions,
    ingredients,
    tags,
    steps,
    user_id,
  } = payload;

  // 1️⃣ Crear la receta
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert([{ name, type, rating, instructions, user_id }])
    .select()
    .single();

  if (recipeError) throw recipeError;
  const recipeId = recipe.id;

  // 2️⃣ Manejar ingredientes
  const ingredientsData = [];

  for (let i of ingredients) {
    let ingredientId = i.id;

    // Si el ingrediente no existe en DB, crearlo
    if (!ingredientId || !(await getIngredientById(ingredientId))) {
      const newIngredient = await createIngredient({ name: i.name }, user_id);
      ingredientId = newIngredient.id;
    }

    ingredientsData.push({
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      quantity: i.quantity || null,
      unit: i.unit || null,
    });
  }

  // Insertar relaciones receta-ingredientes
  if (ingredientsData.length > 0) {
    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsData);

    if (ingError) throw ingError;
  }

  // 3️⃣ Manejar tags
  const tagsData = [];

  for (let tagName of tags) {
    let tagId;

    // Buscar tag existente
    const { data: existingTag } = await supabase
      .from("tags")
      .select("id")
      .eq("name", tagName)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag, error: tagCreateError } = await supabase
        .from("tags")
        .insert({ name: tagName })
        .select()
        .single();
      if (tagCreateError) throw tagCreateError;
      tagId = newTag.id;
    }

    tagsData.push({
      recipe_id: recipeId,
      tag_id: tagId,
    });
  }

  // Insertar relaciones receta-tags
  if (tagsData.length > 0) {
    const { error: tagError } = await supabase
      .from("recipe_tags")
      .insert(tagsData);

    if (tagError) throw tagError;
  }

  // 4️⃣ Manejar pasos (NUEVO)
  if (steps && steps.length > 0) {
    const stepsData = steps.map((text, index) => ({
      recipe_id: recipeId,
      num: index + 1,
      text: text,
    }));

    const { error: stepsError } = await supabase
      .from("recipe_steps")
      .insert(stepsData);

    if (stepsError) throw stepsError;
  }

  // 5️⃣ Devolver receta creada con ingredientes, tags y pasos
  return {
    ...recipe,
    ingredients: ingredientsData,
    tags: tagsData,
    steps: steps || [],
  };
}
export async function fetchTags() {
  const { data, error } = await supabase.from("tags").select("id, name");
  if (error) throw error;
  return data || [];
}

/**
 * Obtener solo los ingredientes que están en shopping_lists para una tienda y usuario
 */
export async function fetchIngredientsByStore(storeId, userId) {
  const { data: shoppingListData, error: shoppingError } = await supabase
    .from("shopping_lists")
    .select(
      `
      ingredient_id,
      amount,
      price,
      ingredient:ingredient_id (
        id,
        name,
        type,
        rating,
        status,
        brand:brand_id(name),
        favorite_store:favorite_store(id,name)
      )
    `
    )
    .eq("store_id", storeId)
    .eq("user_id", userId);

  if (shoppingError) throw shoppingError;

  const ingredientIds =
    shoppingListData?.map((item) => item.ingredient_id) || [];
  if (ingredientIds.length === 0) return [];

  const { data: pricesData, error: pricesError } = await supabase
    .from("ingredient_prices")
    .select("ingredient_id, price, available")
    .eq("store_id", storeId)
    .in("ingredient_id", ingredientIds);

  if (pricesError) throw pricesError;

  return shoppingListData.map((item) => {
    const priceObj = pricesData?.find(
      (p) => p.ingredient_id === item.ingredient_id
    );
    return {
      id: item.ingredient.id,
      name: item.ingredient.name,
      type: item.ingredient.type,
      rating: item.ingredient.rating,
      status: item.ingredient.status,
      brand: item.ingredient.brand,
      favorite_store: item.ingredient.favorite_store,
      storePrice: priceObj?.price ?? item.price ?? 0,
      available: priceObj?.available ?? true,
      amount: item.amount || 1,
      addedToCart: false,
    };
  });
}

/** ------------------ TIENDAS ------------------ */

export async function fetchStores() {
  const { data, error } = await supabase.from("stores").select("*");
  if (error) throw error;
  return data;
}
// Añade esta función a tu src/api/api.js

export async function updateRecipe(recipeId, payload) {
  const {
    name,
    type,
    rating,
    instructions,
    ingredients,
    tags,
    steps,
    user_id,
  } = payload;

  // 1️⃣ Actualizar la receta base
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .update({ name, type, rating, instructions })
    .eq("id", recipeId)
    .select()
    .single();

  if (recipeError) throw recipeError;

  // 2️⃣ Eliminar ingredientes antiguos y crear nuevos
  const { error: deleteIngError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);

  if (deleteIngError) throw deleteIngError;

  const ingredientsData = [];
  for (let i of ingredients) {
    let ingredientId = i.id;

    // Si el ingrediente no existe en DB, crearlo
    if (!ingredientId || !(await getIngredientById(ingredientId))) {
      const newIngredient = await createIngredient({ name: i.name }, user_id);
      ingredientId = newIngredient.id;
    }

    ingredientsData.push({
      recipe_id: recipeId,
      ingredient_id: ingredientId,
      quantity: i.quantity || null,
      unit: i.unit || null,
    });
  }

  // Insertar nuevas relaciones receta-ingredientes
  if (ingredientsData.length > 0) {
    const { error: ingError } = await supabase
      .from("recipe_ingredients")
      .insert(ingredientsData);

    if (ingError) throw ingError;
  }

  // 3️⃣ Eliminar tags antiguos y crear nuevos
  const { error: deleteTagError } = await supabase
    .from("recipe_tags")
    .delete()
    .eq("recipe_id", recipeId);

  if (deleteTagError) throw deleteTagError;

  const tagsData = [];
  for (let tagName of tags) {
    let tagId;

    // Buscar tag existente
    const { data: existingTag } = await supabase
      .from("tags")
      .select("id")
      .eq("name", tagName)
      .maybeSingle();

    if (existingTag) {
      tagId = existingTag.id;
    } else {
      const { data: newTag, error: tagCreateError } = await supabase
        .from("tags")
        .insert({ name: tagName })
        .select()
        .single();
      if (tagCreateError) throw tagCreateError;
      tagId = newTag.id;
    }

    tagsData.push({
      recipe_id: recipeId,
      tag_id: tagId,
    });
  }

  // Insertar nuevas relaciones receta-tags
  if (tagsData.length > 0) {
    const { error: tagError } = await supabase
      .from("recipe_tags")
      .insert(tagsData);

    if (tagError) throw tagError;
  }

  // 4️⃣ Eliminar pasos antiguos y crear nuevos
  const { error: deleteStepsError } = await supabase
    .from("recipe_steps")
    .delete()
    .eq("recipe_id", recipeId);

  if (deleteStepsError) throw deleteStepsError;

  if (steps && steps.length > 0) {
    const stepsData = steps.map((text, index) => ({
      recipe_id: recipeId,
      num: index + 1,
      text: text,
    }));

    const { error: stepsError } = await supabase
      .from("recipe_steps")
      .insert(stepsData);

    if (stepsError) throw stepsError;
  }

  // 5️⃣ Devolver receta actualizada con ingredientes, tags y pasos
  return {
    ...recipe,
    ingredients: ingredientsData,
    tags: tagsData,
    steps: steps || [],
  };
}
/** ------------------ OPERACIONES VARIAS ------------------ */

const handleAddExistingIngredient = async () => {
  if (!selectedIngredient || !selectedStore || !user?.id) return;

  try {
    // Intentamos hacer upsert: si ya existe, actualizamos la cantidad
    const { error } = await supabase.from("shopping_lists").upsert(
      {
        ingredient_id: selectedIngredient.id,
        store_id: selectedStore,
        user_id: user.id,
        amount: 1, // puedes sumar aquí si quieres aumentar la cantidad existente
      },
      { onConflict: ["user_id", "store_id", "ingredient_id"] }
    );

    if (error) {
      console.error(error);
      return;
    }

    // Actualizamos el estado local
    setIngredients((prev) => {
      // Si ya estaba en la lista, no duplicamos
      const exists = prev.some((i) => i.id === selectedIngredient.id);
      if (exists) return prev;
      return [
        ...prev,
        { ...selectedIngredient, addedToCart: false, amount: 1, storePrice: 0 },
      ];
    });

    setSelectedIngredient(null);
    setSearchTerm("");
  } catch (err) {
    console.error(err);
  }
};
// src/api/api.js
export async function fetchRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      `
      *,
      recipe_ingredients (
        ingredient:ingredient_id (
          id,
          name,
          type,
          rating,
          status
        ),
        quantity,
        unit
      ),
      recipe_tags (
        tag:tag_id (
          id,
          name
        )
      )
    `
    )
    .order("name", { ascending: true });

  if (error) throw error;

  return data.map((r) => ({
    ...r,
    ingredients:
      r.recipe_ingredients?.map((i) => ({
        ...i.ingredient,
        quantity: i.quantity,
        unit: i.unit,
      })) || [],
    tags: r.recipe_tags?.map((rt) => rt.tag) || [],
  }));
}
// src/api/api.js
// Reemplaza tu función addRecipeToWeeklyPlan en api.js con esta versión:

export async function addRecipeToWeeklyPlan(
  userId,
  recipeId,
  date = null,
  slot = null
) {
  const { data, error } = await supabase
    .from("weekly_plan_items")
    .insert([
      {
        user_id: userId,
        recipe_id: recipeId,
        date: date,
        slot: slot,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}
// src/api/api.js
export async function fetchWeeklyPlan(userId) {
  const { data, error } = await supabase
    .from("weekly_plan_items")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: true });

  if (error) {
    console.error("Error fetching weekly plan:", error);
    return [];
  }

  return data;
}

// Reemplaza la función addIngredientToAllStores en tu api.js con esta versión:

export async function addIngredientToAllStores(ingredient_id, user_id) {
  // 1. Obtener todas las tiendas
  const { data: stores, error: storeError } = await supabase
    .from("stores")
    .select("*");
  if (storeError) throw storeError;

  // 2. Verificar si hay precios marcados como no disponibles
  const { data: unavailablePrices } = await supabase
    .from("ingredient_prices")
    .select("store_id")
    .eq("ingredient_id", ingredient_id)
    .eq("available", false);

  const unavailableStoreIds = unavailablePrices?.map((p) => p.store_id) ?? [];

  // 3. Verificar qué combinaciones ya existen en shopping_lists
  const { data: existingItems } = await supabase
    .from("shopping_lists")
    .select("store_id")
    .eq("user_id", user_id)
    .eq("ingredient_id", ingredient_id);

  const existingStoreIds = existingItems?.map((item) => item.store_id) ?? [];

  // 4. Filtrar tiendas: no disponibles NI ya existentes
  const shoppingListRows = stores
    .filter(
      (s) =>
        !unavailableStoreIds.includes(s.id) && !existingStoreIds.includes(s.id)
    )
    .map((s) => ({
      user_id: user_id,
      store_id: s.id,
      ingredient_id,
      amount: 1,
    }));

  // 5. Si no hay nada que insertar, retornar array vacío
  if (shoppingListRows.length === 0) {
    console.log("El ingrediente ya está en todas las tiendas disponibles");
    return [];
  }

  // 6. Insertar las nuevas entradas
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert(shoppingListRows)
    .select();

  if (error) throw error;
  return data;
}
export async function deleteListaCompra(id) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", id);
  if (error) throw error;
  return data;
}
// Añade esta nueva función a tu api.js:

/**
 * Actualiza una entrada existente del plan semanal con fecha y slot
 */
export async function updateWeeklyPlanItem(userId, recipeId, date, slot) {
  const { data, error } = await supabase
    .from("weekly_plan_items")
    .update({ date, slot })
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .is("date", null) // Solo actualiza si no tiene fecha asignada
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Verifica si existe una entrada sin fecha para esta receta y usuario
 */
export async function getWeeklyPlanItemWithoutDate(userId, recipeId) {
  const { data, error } = await supabase
    .from("weekly_plan_items")
    .select("*")
    .eq("user_id", userId)
    .eq("recipe_id", recipeId)
    .is("date", null)
    .maybeSingle();

  if (error) throw error;
  return data;
}
export async function updateListaCompra(ingredient) {
  const { data, error } = await supabase.from("shopping_lists").upsert([
    {
      id: ingredient.id,
      store_id: ingredient.storeId,
      amount: ingredient.amount || 1,
      price: ingredient.storePrice || 0,
      user_id: ingredient.userId,
    },
  ]);

  if (error) {
    console.error("Error actualizando lista:", error);
    return null;
  }

  console.log("Fila actualizada/insertada:", data);
  return data;
}

export async function getListaCompra(id) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

export async function getListaCompraByIngredient(id) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("*")
    .eq("ingredient_id", id)
    .maybeSingle();
  if (error) throw error;
  return data ?? null;
}

// src/api/api.js
export async function upsertIngredientPrice({
  ingredient_id,
  store_id,
  price,
  available = true,
}) {
  const { data, error } = await supabase
    .from("ingredient_prices")
    .upsert([{ ingredient_id, store_id, price, available }], {
      onConflict: ["ingredient_id", "store_id"], // ¡asegúrate de tener un índice único compuesto!
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}
/** ------------------ SHOPPING LIST DEL USUARIO ------------------ */

export async function fetchShoppingListIngredients(storeId, userId) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("ingredient_id, amount")
    .eq("user_id", userId)
    .eq("store_id", storeId);

  if (error) {
    console.error("Error fetching shopping list:", error);
    return [];
  }

  return data;
}
export async function addIngredientToShoppingListUser(
  userId,
  ingredientId,
  storeId
) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .upsert(
      [
        {
          user_id: userId,
          ingredient_id: ingredientId,
          store_id: storeId,
          amount: 1,
        },
      ],
      {
        onConflict: ["user_id", "ingredient_id", "store_id"], // evita duplicados
      }
    )
    .select();
  if (error) throw error;
  return data;
}

export async function removeIngredientFromShoppingList(userId, ingredientId) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("user_id", userId)
    .eq("ingredient_id", ingredientId);
  if (error) throw error;
  return data;
}

export async function fetchUserShoppingList(userId) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("ingredient_id");
  if (error) throw error;
  return data.map((item) => item.ingredient_id);
}
export async function fetchBrands() {
  const { data, error } = await supabase.from("brands").select("*");
  if (error) throw error;
  return data;
}
