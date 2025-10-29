// src/api/ingredients.js
import { supabase } from "./supabaseClient";

/**
 * Obtiene ingredientes visibles para el usuario (RLS en Supabase debe estar configurado).
 */
export async function fetchIngredients() {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .order("name", { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function createIngredient(payload) {
  // payload: { name, brand, type, rating, status, favorite_store, user_id }
  const { data, error } = await supabase
    .from("ingredients")
    .insert([payload])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getIngredientById(id) {
  const { data, error } = await supabase
    .from("ingredients")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data ?? null;
}
