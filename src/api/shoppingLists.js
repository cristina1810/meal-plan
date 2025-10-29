// src/api/shoppingLists.js
import { supabase } from "./supabaseClient";

/**
 * Obtiene todas las shopping_lists del usuario, con sus items.
 */
export async function fetchShoppingListsForUser(user_id) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id, store_id, name, shopping_list_items(*)")
    .eq("user_id", user_id);

  if (error) throw error;
  return data || [];
}

/**
 * Añade ingredientId a todas las listas del usuario.
 * Previene duplicados: si ya existe (shopping_list_id, ingredient_id) no lo inserta.
 * Devuelve los items insertados.
 */
export async function addIngredientToAllLists(
  user_id,
  ingredientId,
  { quantity = 1, unit = "u", price = null } = {}
) {
  // 1) obtener shopping_lists del usuario
  const { data: lists, error: errLists } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user_id);

  if (errLists) throw errLists;
  if (!lists || lists.length === 0) return [];

  const listIds = lists.map((l) => l.id);

  // 2) comprobar qué (listId, ingredientId) ya existen
  const { data: existing, error: errExist } = await supabase
    .from("shopping_list_items")
    .select("shopping_list_id, ingredient_id")
    .in("shopping_list_id", listIds)
    .eq("ingredient_id", ingredientId);

  if (errExist) throw errExist;

  const existingMap = new Set((existing || []).map((e) => e.shopping_list_id));

  // 3) construir inserts sólo para listas que no lo tengan
  const itemsToInsert = listIds
    .filter((id) => !existingMap.has(id))
    .map((id) => ({
      shopping_list_id: id,
      ingredient_id: ingredientId,
      quantity,
      unit,
      price,
    }));

  if (itemsToInsert.length === 0) return [];

  const { data: inserted, error: errInsert } = await supabase
    .from("shopping_list_items")
    .insert(itemsToInsert)
    .select();

  if (errInsert) throw errInsert;
  return inserted || [];
}
