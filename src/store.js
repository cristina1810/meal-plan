export const initialStore = () => ({
  ingredients: [],
  recipes: [],
  shoppingList: [], // IDs de ingredientes en shopping_lists
  stores: [],
  selectedStore: null,
  weeklyPlan: [],
  loading: false,
  error: null,
});

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    // Stores
    case "ADD_RECIPE":
      return { ...store, recipes: [action.payload, ...store.recipes] };

    case "SET_STORES":
      return { ...store, stores: action.payload };

    case "SET_SELECTED_STORE":
      return { ...store, selectedStore: action.payload };

    // Shopping List (array de ingredient IDs)
    case "SET_SHOPPING_LIST":
      return { ...store, shoppingList: action.payload };

    case "ADD_TO_SHOPPING_LIST":
      return {
        ...store,
        shoppingList: [...store.shoppingList, action.payload],
      };

    case "REMOVE_FROM_SHOPPING_LIST":
      return {
        ...store,
        shoppingList: store.shoppingList.filter((id) => id !== action.payload),
      };

    // Ingredients
    case "SET_INGREDIENTS":
      return { ...store, ingredients: action.payload };

    case "ADD_INGREDIENT":
      return { ...store, ingredients: [action.payload, ...store.ingredients] };

    case "UPDATE_INGREDIENT":
      return {
        ...store,
        ingredients: store.ingredients.map((i) =>
          i.id === action.payload.id ? { ...i, ...action.payload.updates } : i
        ),
      };

    // Recipes
    case "SET_RECIPES":
      return { ...store, recipes: action.payload };

    case "ADD_RECIPE":
      return { ...store, recipes: [action.payload, ...store.recipes] };

    // Weekly Plan
    case "SET_WEEKLY_PLAN":
      return { ...store, weeklyPlan: action.payload };

    // Loading & Error
    case "SET_LOADING":
      return { ...store, loading: action.payload };

    case "SET_ERROR":
      return { ...store, error: action.payload };

    default:
      return store;
  }
}
