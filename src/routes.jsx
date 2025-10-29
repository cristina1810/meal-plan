// src/routes.jsx
import { BrowserRouter, Routes, Route } from "react-router-dom";
import App from "./App.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Ingredients from "./pages/Ingredients.jsx";
import Recipes from "./pages/Recipes.jsx";
import ShoppingLists from "./pages/ShoppingLists.jsx";
import WeeklyPlan from "./pages/WeeklyPlan.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";

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
          <Route path="shopping-lists" element={<ShoppingLists />} />
          <Route path="weekly-plan" element={<WeeklyPlan />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
