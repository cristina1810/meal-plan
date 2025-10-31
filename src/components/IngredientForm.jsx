// src/components/IngredientForm.jsx
import { useState, useEffect } from "react";
import { Star, Minus } from "lucide-react";
import useGlobalReducer from "../context/useGlobalReducer";
import {
  createIngredient,
  updateIngrediente,
  fetchStores,
  upsertIngredientPrice,
  fetchBrands,
} from "../api/api";
import { TIPOS_INGREDIENTES, ESTADOS_COMIDA } from "../constants";

const IngredientForm = ({
  setShowForm,
  ingrediente,
  setIngredienteEditando,
}) => {
  const { dispatch } = useGlobalReducer();

  const [nombre, setNombre] = useState("");
  const [tipo, setTipo] = useState("");
  const [estado, setEstado] = useState("");
  const [valoracion, setValoracion] = useState(0);
  const [tiendasDisponibles, setTiendasDisponibles] = useState([]);
  const [tiendasEliminadas, setTiendasEliminadas] = useState([]);
  const [tiendaFavorita, setTiendaFavorita] = useState(null);
  const [precios, setPrecios] = useState([]);

  // Marcas
  const [marca, setMarca] = useState("");
  const [marcas, setMarcas] = useState([]);
  const [filteredMarcas, setFilteredMarcas] = useState([]);
  const [showMarcaDropdown, setShowMarcaDropdown] = useState(false);

  // Cargar marcas al montar
  useEffect(() => {
    async function loadBrands() {
      const data = await fetchBrands();
      setMarcas(data || []);
    }
    loadBrands();
  }, []);

  // Cargar tiendas
  useEffect(() => {
    async function loadStores() {
      const stores = await fetchStores();
      setTiendasDisponibles(stores || []);
      setPrecios((stores || []).map((t) => ({ tienda_id: t.id, precio: "" })));
    }
    loadStores();
  }, []);

  // Si estamos editando un ingrediente, cargar datos
  useEffect(() => {
    async function loadStores() {
      const stores = await fetchStores();
      setTiendasDisponibles(stores || []);

      // Si tenemos ingrediente, usamos sus precios
      if (ingrediente?.ingredient_prices?.length) {
        setPrecios(
          stores.map((t) => {
            const p = ingrediente.ingredient_prices.find(
              (ip) => ip.store?.id === t.id
            );
            return {
              tienda_id: t.id,
              precio: p?.price ?? "",
            };
          })
        );
      } else {
        setPrecios(
          (stores || []).map((t) => ({ tienda_id: t.id, precio: "" }))
        );
      }
    }
    loadStores();
  }, [ingrediente]);
  useEffect(() => {
    if (ingrediente) {
      setNombre(ingrediente.name || "");
      setTipo(ingrediente.type || "");
      setEstado(ingrediente.status || "");
      setValoracion(ingrediente.rating || 0);
      setTiendaFavorita(ingrediente.favorite_store?.id || null);
      setMarca(ingrediente.brand?.name || "");
    } else {
      setNombre("");
      setTipo("");
      setEstado("");
      setValoracion(0);
      setTiendaFavorita(null);
      setMarca("");
    }
  }, [ingrediente]);

  // Filtrar marcas mientras escribes
  useEffect(() => {
    if (marca) {
      const f = marcas.filter((b) =>
        b.name.toLowerCase().includes(marca.toLowerCase())
      );
      setFilteredMarcas(f);
      setShowMarcaDropdown(f.length > 0);
    } else {
      setFilteredMarcas([]);
      setShowMarcaDropdown(false);
    }
  }, [marca, marcas]);

  const handleSelectMarca = (name) => {
    setMarca(name);
    setShowMarcaDropdown(false);
  };

  const handleFavorita = (tiendaId) => {
    setTiendaFavorita((prev) => (prev === tiendaId ? null : tiendaId));
  };

  const handleEliminarTienda = (tiendaId) => {
    setTiendasDisponibles((prev) => prev.filter((t) => t.id !== tiendaId));
    setTiendasEliminadas((prev) => [...prev, tiendaId]);
    setPrecios((prev) => prev.filter((p) => p.tienda_id !== tiendaId));
  };

  const handlePrecioChange = (tiendaId, value) => {
    setPrecios((prev) =>
      prev.map((p) => (p.tienda_id === tiendaId ? { ...p, precio: value } : p))
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // --- Gestionar marca ---
      let brandId = null;
      const existingBrand = marcas.find(
        (b) => b.name.toLowerCase() === marca.toLowerCase()
      );
      if (existingBrand) {
        brandId = existingBrand.id;
      } else if (marca) {
        const newBrand = await supabase
          .from("brands")
          .insert([{ name: marca }])
          .select()
          .single();
        brandId = newBrand.data.id;
      }

      let ingredienteId;
      let ingredienteActualizado;

      // --- Crear o actualizar ingrediente ---
      if (ingrediente) {
        ingredienteActualizado = await updateIngrediente(ingrediente.id, {
          name: nombre,
          type: tipo,
          status: estado,
          rating: valoracion,
          favorite_store: tiendaFavorita,
          brand_id: brandId,
        });
        ingredienteId = ingredienteActualizado.id;

        dispatch({
          type: "UPDATE_INGREDIENT",
          payload: { id: ingredienteId, updates: ingredienteActualizado },
        });
      } else {
        ingredienteActualizado = await createIngredient(
          {
            name: nombre,
            type: tipo,
            status: estado,
            rating: valoracion,
            favorite_store: tiendaFavorita,
            brand_id: brandId,
          },
          null
        );
        ingredienteId = ingredienteActualizado.id;

        dispatch({ type: "ADD_INGREDIENT", payload: ingredienteActualizado });
      }

      // --- Guardar precios ---
      for (const p of precios) {
        await upsertIngredientPrice({
          ingredient_id: ingredienteId,
          store_id: p.tienda_id,
          price: p.precio ? parseFloat(p.precio) : null,
          available: true,
        });
      }

      for (const id of tiendasEliminadas) {
        await upsertIngredientPrice({
          ingredient_id: ingredienteId,
          store_id: id,
          available: false,
        });
      }

      setShowForm(false);
      setIngredienteEditando(null);
    } catch (err) {
      console.error("Error guardando ingrediente:", err);
      alert("Error guardando ingrediente. Revisa la consola.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="rounded-xl w-full max-w-md flex flex-col gap-4 p-6 shadow-xl bg-white">
        <h2 className="text-2xl font-bold text-center">
          {ingrediente ? "Editar ingrediente" : "Añadir ingrediente"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombre y valoración */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">
                Nombre
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Tomate pera"
                className="mt-1 w-full rounded-full border-1 p-1 px-3  bg-[var(--input)]/50 border-[var(--input)] placeholder:text-[var(--input)] placeholder:font-medium"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">
                Valoración
              </label>
              <div className="flex gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-6 h-6 cursor-pointer ${
                      valoracion >= n
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-gray-300"
                    }`}
                    onClick={() => setValoracion(n)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Tipo y Estado */}
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">Tipo</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="mt-1 w-full rounded-full border-1 p-1 px-3  bg-[var(--input)]/50 border-[var(--input)] placeholder:text-[var(--input)] placeholder:font-medium"
              >
                <option value="">Selecciona</option>
                {TIPOS_INGREDIENTES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1">
              <label className="text-sm font-medium text-gray-600">
                Estado
              </label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value)}
                className="mt-1 w-full rounded-full border-1 p-1 px-3  bg-[var(--input)]/50 border-[var(--input)] placeholder:text-[var(--input)] placeholder:font-medium"
              >
                <option value="">Selecciona</option>
                {ESTADOS_COMIDA.map((e) => (
                  <option key={e} value={e}>
                    {e}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Marca */}
          <div className="relative">
            <label className="text-sm font-medium text-gray-600">Marca</label>
            <input
              type="text"
              value={marca}
              onChange={(e) => setMarca(e.target.value)}
              placeholder="Ej: Knorr"
              className="mt-1 w-full rounded-full border-1 p-1 px-3  bg-[var(--input)]/50 border-[var(--input)] placeholder:text-[var(--input)] placeholder:font-medium"
              onFocus={() =>
                marca && setShowMarcaDropdown(filteredMarcas.length > 0)
              }
              onBlur={() => setTimeout(() => setShowMarcaDropdown(false), 100)}
            />
            {showMarcaDropdown && (
              <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded mt-1 max-h-40 overflow-y-auto">
                {filteredMarcas.map((b) => (
                  <li
                    key={b.id}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                    onClick={() => handleSelectMarca(b.name)}
                  >
                    {b.name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tiendas y precios */}
          <div>
            <p className="font-medium text-gray-600 mb-2">Tiendas y precios</p>
            {tiendasDisponibles.map((t) => (
              <div
                key={t.id}
                className="flex justify-between items-center gap-3 mb-2 pb-1"
              >
                <button
                  type="button"
                  onClick={() => handleFavorita(t.id)}
                  className="p-1"
                >
                  <Star
                    className={`cursor-pointer w-5 h-5 ${
                      tiendaFavorita === t.id
                        ? "text-[var(--star-color)] fill-[var(--star-color)]"
                        : "text-gray-400"
                    }`}
                  />
                </button>
                <span className="flex-1">{t.name}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={
                    precios.find((p) => p.tienda_id === t.id)?.precio || ""
                  }
                  onChange={(e) => handlePrecioChange(t.id, e.target.value)}
                  className="w-20 rounded-full border-1 p-1 px-3  bg-[var(--input)]/50 border-[var(--input)] placeholder:text-gray-300 text-end placeholder:font-medium"
                  placeholder="0.99"
                />

                <button
                  type="button"
                  onClick={() => handleEliminarTienda(t.id)}
                  className="p-0.5 bg-red-500 rounded-full text-white"
                >
                  <Minus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          {/* Botones */}
          <div className="flex gap-4 mt-4">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="flex-1 py-3 px-4 rounded-lg font-bold bg-[var(--button-added-color)] text-white hover:bg-opacity-80"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-lg font-bold bg-[var(--button-color)]/30 text-[var(--button-color)] hover:bg-opacity-90"
            >
              {ingrediente ? "Guardar cambios" : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IngredientForm;
