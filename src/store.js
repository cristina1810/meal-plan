export const initialStore = () => ({
  ingredients: [],
  recipes: [],
  shoppingLists: [],
  weeklyPlan: [],
  loading: false,
  error: null,
});

export default function storeReducer(store, action = {}) {
  switch (action.type) {
    case "SET_INGREDIENTS":
      return { ...store, ingredients: action.payload };
    case "ADD_INGREDIENT":
      return { ...store, ingredients: [action.payload, ...store.ingredients] };
    case "SET_RECIPES":
      return { ...store, recipes: action.payload };
    case "SET_SHOPPING_LISTS":
      return { ...store, shoppingLists: action.payload };
    case "SET_WEEKLY_PLAN":
      return { ...store, weeklyPlan: action.payload };
    case "SET_LOADING":
      return { ...store, loading: action.payload };
    case "SET_ERROR":
      return { ...store, error: action.payload };
    default:
      return store;
  }
}
