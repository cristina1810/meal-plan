import React, { useEffect, useState } from "react";
import { supabase } from "../api/supabaseClient";
import { useAuth } from "../context/AuthContext";
import {
  fetchStores,
  fetchIngredientsByStore,
  addIngredientToShoppingListUser,
  addIngredientToAllStores,
} from "../api/api";
import {
  Menu,
  Plus,
  Minus,
  Check,
  ChevronDown,
  ShoppingBasket,
} from "lucide-react";
import Sidebar from "../components/Sidebar";
import { TIPOS_INGREDIENTES } from "../constants";

export default function ListaCompra() {
  const { user } = useAuth();
  const [stores, setStores] = useState([]);
  const [selectedStore, setSelectedStore] = useState(null);
  const [ingredients, setIngredients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newIngredient, setNewIngredient] = useState({
    name: "",
    type: "",
    brand: "",
  });
  const [openTypes, setOpenTypes] = useState({});
  const [allIngredients, setAllIngredients] = useState([]);
  const [ingredientSuggestions, setIngredientSuggestions] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [brandSuggestions, setBrandSuggestions] = useState([]);
  const [selectedIngredient, setSelectedIngredient] = useState(null);
  const [ingredientSelected, setIngredientSelected] = useState(false);

  // ---------------------------
  // CARGA INICIAL DE TIENDAS E INGREDIENTES
  // ---------------------------
  useEffect(() => {
    async function loadStores() {
      const data = await fetchStores();
      setStores(data);
      if (data.length > 0) setSelectedStore(data[0].id);
    }
    loadStores();
  }, []);

  useEffect(() => {
    if (!selectedStore || !user?.id) return;
    setLoading(true);
    async function loadIngredients() {
      try {
        const data = await fetchIngredientsByStore(selectedStore, user.id);
        console.log(data);
        const withCartState = data.map((i) => ({
          ...i,
          addedToCart: false,
          amount: i.amount || 1,
          storePrice: i.storePrice || 0,
        }));
        setIngredients(withCartState);

        const types = [...new Set(withCartState.map((i) => i.type))];
        const openState = {};
        types.forEach((t) => (openState[t] = true));
        setOpenTypes(openState);
      } catch (err) {
        console.error("Error cargando ingredientes:", err);
      } finally {
        setLoading(false);
      }
    }
    loadIngredients();
  }, [selectedStore, user]);

  // ---------------------------
  // CARGAR TODOS LOS INGREDIENTES Y MARCAS
  // ---------------------------
  useEffect(() => {
    async function loadAllIngredients() {
      const { data, error } = await supabase.from("ingredients").select("*");
      if (!error) {
        setAllIngredients(data);
        const brands = [...new Set(data.map((i) => i.brand).filter(Boolean))];
        setAllBrands(brands);
      }
    }
    loadAllIngredients();
  }, []);

  // ---------------------------
  // FILTRO DE SUGERENCIAS DE INGREDIENTES
  // ---------------------------
  useEffect(() => {
    if (!searchTerm) return setIngredientSuggestions([]);
    const filtered = allIngredients.filter((i) =>
      i.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setIngredientSuggestions(filtered);
  }, [searchTerm, allIngredients]);

  // ---------------------------
  // FILTRO DE SUGERENCIAS DE MARCAS
  // ---------------------------
  useEffect(() => {
    if (!newIngredient.brand) return setBrandSuggestions([]);
    const filtered = allBrands.filter((b) =>
      b.toLowerCase().includes(newIngredient.brand.toLowerCase())
    );
    setBrandSuggestions(filtered);
  }, [newIngredient.brand, allBrands]);

  // ---------------------------
  // FUNCIONES FORMULARIO
  // ---------------------------
  const handleNewIngredientChange = (field, value) => {
    setNewIngredient((prev) => ({ ...prev, [field]: value }));
  };

  const handleSelectIngredient = (ingredient) => {
    setSelectedIngredient(ingredient);
    setSearchTerm(ingredient.name); // actualiza el input
    setIngredientSuggestions([]); // cierra la lista de sugerencias
  };

  const handleAddExistingIngredient = async () => {
    if (!selectedIngredient || !user?.id) return;

    try {
      const inserted = await addIngredientToAllStores(
        selectedIngredient.id,
        user.id
      );

      // Evitamos duplicados en el estado local
      setIngredients((prev) => {
        const exists = prev.some((i) => i.id === selectedIngredient.id);
        if (exists) return prev;
        return [
          ...prev,
          {
            ...selectedIngredient,
            addedToCart: false,
            amount: 1,
            storePrice: 0,
          },
        ];
      });

      setSelectedIngredient(null);
      setSearchTerm("");
      setIngredientSelected(false);
    } catch (err) {
      console.error(err);
      alert("Error añadiendo ingrediente: " + (err.message ?? err));
    }
  };

  const handleCreateIngredient = async () => {
    if (!newIngredient.name || !newIngredient.type) {
      alert("Nombre y tipo son obligatorios");
      return;
    }

    if (!user?.id) {
      alert("Usuario no definido");
      return;
    }

    setLoading(true);

    try {
      let brandId = null;

      // 1️⃣ Crear la marca si no existe
      if (newIngredient.brand) {
        const { data: existingBrand, error: brandError } = await supabase
          .from("brands")
          .select("*")
          .eq("name", newIngredient.brand)
          .maybeSingle();

        if (brandError) throw brandError;

        if (existingBrand) {
          brandId = existingBrand.id;
        } else {
          const { data: newBrand, error: newBrandError } = await supabase
            .from("brands")
            .insert({ name: newIngredient.brand })
            .select()
            .maybeSingle();
          if (newBrandError) throw newBrandError;
          brandId = newBrand.id;
          setAllBrands((prev) => [...prev, newIngredient.brand]);
        }
      }

      // 2️⃣ Crear ingrediente
      const { data: insertedIngredient, error: ingredientError } =
        await supabase
          .from("ingredients")
          .insert({
            name: newIngredient.name,
            type: newIngredient.type,
            brand_id: brandId,
            status: "Pendiente",
            user_id: user.id,
          })
          .select()
          .maybeSingle();

      if (ingredientError || !insertedIngredient) {
        console.error("Error creando ingrediente:", ingredientError);
        return;
      }

      // 3️⃣ Insertar/upsert en ingredient_prices y shopping_lists para todas las tiendas
      for (const store of stores) {
        // ingredient_prices
        await supabase.from("ingredient_prices").upsert(
          {
            ingredient_id: insertedIngredient.id,
            store_id: store.id,
            user_id: user.id,
            price: 0,
            available: false,
          },
          { onConflict: ["ingredient_id", "store_id", "user_id"] }
        );

        // shopping_lists
        await supabase.from("shopping_lists").upsert(
          {
            ingredient_id: insertedIngredient.id,
            store_id: store.id,
            user_id: user.id,
            amount: 1,
          },
          { onConflict: ["user_id", "ingredient_id", "store_id"] }
        );
      }

      // 4️⃣ Actualizar estado local
      setIngredients((prev) => [
        ...prev,
        { ...insertedIngredient, addedToCart: false, amount: 1, storePrice: 0 },
      ]);

      setNewIngredient({ name: "", type: "", brand: "" });
      setShowAddForm(false);
      setShowForm(false);
    } catch (err) {
      console.error("Error agregando ingrediente:", err);
      alert("Hubo un error al crear el ingrediente.");
    } finally {
      setLoading(false);
    }
  };
  console.log(selectedStore);
  // ---------------------------
  // FUNCIONES INGREDIENTES
  // ---------------------------
  const toggleType = (type) => {
    setOpenTypes((prev) => ({ ...prev, [type]: !prev[type] }));
  };

  const groupedIngredients = ingredients.reduce((acc, i) => {
    if (!acc[i.type]) acc[i.type] = [];
    acc[i.type].push(i);
    return acc;
  }, {});

  const markAsUnavailable = async (id) => {
    if (!selectedStore || !user?.id) return;
    try {
      const { error } = await supabase
        .from("ingredient_prices")
        .update({ available: false })
        .eq("ingredient_id", id)
        .eq("store_id", selectedStore)
        .eq("user_id", user.id);
      if (error) console.error(error);
      setIngredients((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handlePriceChange = (id, newPrice) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, storePrice: newPrice } : i))
    );
  };

  const handleAmountChange = async (id, delta) => {
    const updated = ingredients.map((i) =>
      i.id === id ? { ...i, amount: Math.max(1, i.amount + delta) } : i
    );
    setIngredients(updated);
    const ing = updated.find((i) => i.id === id);
    try {
      await supabase
        .from("shopping_lists")
        .update({ amount: ing.amount })
        .eq("ingredient_id", id)
        .eq("store_id", selectedStore)
        .eq("user_id", user.id);
    } catch (err) {
      console.error(err);
    }
  };

  const toggleCart = (id) => {
    setIngredients((prev) =>
      prev.map((i) => (i.id === id ? { ...i, addedToCart: !i.addedToCart } : i))
    );
  };

  const handleCompletarCompra = async () => {
    if (!selectedStore || !user?.id) return;
    const carrito = ingredients.filter((i) => i.addedToCart);
    if (carrito.length === 0) {
      alert("No hay ingredientes seleccionados en el carrito.");
      return;
    }
    setLoading(true);
    try {
      const deletedIds = [];
      for (const i of carrito) {
        const { data: existingPrice } = await supabase
          .from("ingredient_prices")
          .select("id")
          .eq("ingredient_id", i.id)
          .eq("store_id", selectedStore)
          .eq("user_id", user.id)
          .maybeSingle();
        if (existingPrice) {
          await supabase
            .from("ingredient_prices")
            .update({ price: i.storePrice, available: true })
            .eq("id", existingPrice.id);
        } else {
          await supabase.from("ingredient_prices").insert([
            {
              ingredient_id: i.id,
              store_id: selectedStore,
              user_id: user.id,
              price: i.storePrice,
              available: true,
            },
          ]);
        }
        await supabase
          .from("ingredients")
          .update({ status: "Disponible" })
          .eq("id", i.id);
        await supabase
          .from("shopping_lists")
          .delete()
          .eq("ingredient_id", i.id)
          .eq("user_id", user.id);
        deletedIds.push(i.id);
      }
      setIngredients((prev) => prev.filter((i) => !deletedIds.includes(i.id)));
      alert(
        `¡Compra completada! ${deletedIds.length} ingredientes procesados.`
      );
    } catch (err) {
      console.error(err);
      alert("Error al completar la compra.");
    } finally {
      setLoading(false);
    }
  };

  if (!user) return <div style={{ padding: 16 }}>Cargando usuario...</div>;

  return (
    <div className="">
      {/* CABECERA */}
      <div className="flex items-center gap-2 p-4 sticky top-0 bg-[var(--bg-light)]/80 backdrop-blur-sm justify-between">
        <Menu onClick={() => setSidebarOpen(true)} />
        <select
          value={selectedStore || ""}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="border-none outline-none appearance-none rounded px-2  [text-align-last:center] text-2xl font-bold"
        >
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <Plus onClick={() => setShowForm(!showForm)} />
      </div>

      {/* FORMULARIO AÑADIR/CREAR */}
      {showForm && (
        <div className="flex flex-col gap-2  rounded shadow mx-2 p-2 relative">
          {/* Ingrediente existente */}
          <div className="relative w-full flex flex-col gap-2 ">
            <div className="flex gap-2 items-center">
              <input
                type="text"
                placeholder="Buscar ingrediente existente"
                className="p-2 bg-[var(--input)]/50 border border-[var(--input)] rounded w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setIngredientSelected(false); // volvemos a permitir sugerencias al escribir
                }}
              />
              {/* Botón para añadir ingrediente existente */}
              <button
                className="p-2  rounded-full flex items-center gap-1  mt-2 bg-[#D6A99D]/50 text-[#D6A99D] "
                onClick={handleAddExistingIngredient}
              >
                <Check className="w-4 h-4 mx-auto " />
              </button>
              <button
                className="p-2 rounded-full flex items-center gap-1 mt-2 mx-auto bg-[#689B8A]/50 text-[#689B8A]"
                onClick={() => setShowAddForm(!showAddForm)}
              >
                <Plus className="w-4 h-4 mx-auto" />
              </button>
            </div>
            {/* Lista de sugerencias */}
            {ingredientSuggestions.length > 0 && !ingredientSelected && (
              <ul className="absolute top-full left-0 z-10 bg-white border w-full max-h-40 overflow-auto mt-1 rounded shadow">
                {ingredientSuggestions.map((ing) => (
                  <li
                    key={ing.id}
                    className="p-1 cursor-pointer hover:bg-gray-200"
                    onClick={() => {
                      setSelectedIngredient(ing);
                      setSearchTerm(ing.name);
                      setIngredientSelected(true); // bloquea lista al seleccionar
                      setIngredientSuggestions([]); // opcional, limpia el array
                    }}
                  >
                    {ing.name} {ing.brand ? `(${ing.brand})` : ""}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {showAddForm && (
            <div className="flex flex-col gap-2 p-2 mt-2 relative">
              <input
                className="p-2 bg-[var(--input)]/50 border border-[var(--input)] rounded w-full"
                type="text"
                placeholder="Nombre"
                value={newIngredient.name}
                onChange={(e) =>
                  handleNewIngredientChange("name", e.target.value)
                }
              />

              <input
                className="p-2 bg-[var(--input)]/50 border border-[var(--input)] rounded w-full"
                type="text"
                placeholder="Marca"
                value={newIngredient.brand}
                onChange={(e) =>
                  handleNewIngredientChange("brand", e.target.value)
                }
              />
              {brandSuggestions.length > 0 && (
                <ul className="absolute z-10 bg-white border w-full max-h-40 overflow-auto">
                  {brandSuggestions.map((b) => (
                    <li
                      key={b}
                      className="p-1 cursor-pointer hover:bg-gray-200"
                      onClick={() => handleNewIngredientChange("brand", b)}
                    >
                      {b}
                    </li>
                  ))}
                </ul>
              )}
              <div className="flex gap-2">
                <select
                  value={newIngredient.type}
                  onChange={(e) =>
                    handleNewIngredientChange("type", e.target.value)
                  }
                  className="p-2 bg-[var(--input)]/50 border border-[var(--input)] rounded w-full py-2"
                >
                  <option value="">Seleccionar tipo</option>
                  {TIPOS_INGREDIENTES.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
                <button
                  className="p-2  rounded flex items-center gap-1 w-32 bg-[#689B8A]/30 text-[#689B8A]"
                  onClick={handleCreateIngredient}
                >
                  Crear y añadir
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Resto del render de ingredientes y totales */}
      {loading ? (
        <p>Cargando ingredientes...</p>
      ) : ingredients.length === 0 ? (
        <p>No hay ingredientes en la lista para esta tienda.</p>
      ) : (
        <div className="space-y-4 p-2 mb-2 ">
          {Object.entries(groupedIngredients).map(([type, items]) => (
            <div key={type}>
              <div
                className="w-full text-left font-semibold text-lg py-2 px-2 bg-[var(--pill-unselected-color)] rounded-full flex justify-between items-center"
                onClick={() => toggleType(type)}
              >
                <div className="flex items-center gap-2 ml-2">
                  {type} ({items.length})
                </div>
                <span>
                  {openTypes[type] ? (
                    <ChevronDown className="rotate-180 mr-2" />
                  ) : (
                    <ChevronDown className="mr-2" />
                  )}
                </span>
              </div>

              {openTypes[type] &&
                items.map((i) => (
                  <div
                    className="gap-2 items-center p-4 shadow-md rounded my-2"
                    key={i.id}
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-medium">{i.name}</p>
                      {i.favorite_store?.id &&
                        i.favorite_store?.id !== selectedStore && (
                          <p className="text-[var(--text-favorite-store-color)] bg-[var(--favorite-store-color)] px-3 rounded-full">
                            {i.favorite_store?.name}
                          </p>
                        )}
                    </div>
                    <div className="flex gap-2 items-center justify-between">
                      <div className="flex gap-2">
                        <div className="flex items-center gap-2">
                          <button
                            className="bg-red-600 text-white p-1 rounded-full"
                            onClick={() => handleAmountChange(i.id, -1)}
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          {i.amount}
                          <button
                            className="bg-green-600 text-white p-1 rounded-full"
                            onClick={() => handleAmountChange(i.id, 1)}
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                          ud/s
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            className="border border-[var(--input)] text-end px-2 w-10"
                            type="number"
                            value={i.storePrice || 0}
                            onChange={(e) =>
                              handlePriceChange(
                                i.id,
                                parseFloat(e.target.value) || 0
                              )
                            }
                            step="0.01"
                          />
                          €
                        </div>
                      </div>
                      <div className="flex items-center gap-2 ">
                        {i.storePrice === 0 || i.storePrice === null ? (
                          <button
                            onClick={() => markAsUnavailable(i.id)}
                            className="p-2 rounded bg-[var(--urgente)]/40 text-[var(--urgente)]"
                          >
                            Marcar no disponible
                          </button>
                        ) : (
                          <button
                            className="p-2 rounded"
                            onClick={() => toggleCart(i.id)}
                          >
                            {i.addedToCart ? (
                              <div className="flex p-2 rounded items-center gap-1.5 bg-[var(--button-added-color)] text-white ">
                                <Check className="w-4 h-4" /> Añadido
                              </div>
                            ) : (
                              <div className="flex p-2 rounded items-center gap-1.5 bg-[var(--button-color)] text-white">
                                <ShoppingBasket
                                  className="w-4 h-4"
                                  strokeWidth={1.5}
                                />{" "}
                                Añadir
                              </div>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          ))}
        </div>
      )}

      <div className="bg-[var(--input)]/80 shadow-lg backdrop-blur-sm p-4 mt-4 fixed bottom-0 w-full gap-2 rounded-t-3xl">
        <div className="flex justify-between my-1 text-sm">
          <strong>Total estimado:</strong>{" "}
          {ingredients
            .reduce((sum, i) => sum + (i.storePrice || 0) * (i.amount || 1), 0)
            .toFixed(2)}{" "}
          €
        </div>
        <div className="flex justify-between my-1 text-base ">
          <strong>Total carrito:</strong>{" "}
          {ingredients
            .filter((i) => i.addedToCart)
            .reduce((sum, i) => sum + (i.storePrice || 0) * (i.amount || 1), 0)
            .toFixed(2)}{" "}
          €
        </div>
        <button
          className="p-2 rounded-full bg-[var(--available)]/40 text-[var(--available)] w-full my-1 font-semibold "
          onClick={handleCompletarCompra}
          disabled={
            loading || ingredients.filter((i) => i.addedToCart).length === 0
          }
        >
          {loading ? "Procesando..." : "Completar compra"}
        </button>
      </div>

      {sidebarOpen && <Sidebar onClose={() => setSidebarOpen(false)} />}
    </div>
  );
}
