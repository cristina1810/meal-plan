// src/routes.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Ingredients from "./pages/Ingredients.jsx";
import Recipes from "./pages/Recipes.jsx";
import ShoppingList from "./pages/ShoppingList.jsx";
import WeeklyPlan from "./pages/WeeklyPlan.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Recipe from "./pages/Recipe.jsx";
import Config from "./pages/Config.jsx";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <App />
            </ProtectedRoute>
          }
        >
          <Route index element={<Ingredients />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="shopping-list" element={<ShoppingList />} />
          <Route path="weekly-plan" element={<WeeklyPlan />} />
          <Route path="recipe/:id" element={<Recipe />} />
          <Route path="config" element={<Config />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
