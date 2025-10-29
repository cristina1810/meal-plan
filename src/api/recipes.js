// src/api/recipes.js
import { supabase } from "./supabaseClient";

export async function fetchRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "*, recipe_tags(tag), recipe_ingredients(ingredient_id, quantity, unit)"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createRecipe(payload) {
  // payload ejemplo: { user_id, name, rating, instructions }
  const { data, error } = await supabase
    .from("recipes")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}
