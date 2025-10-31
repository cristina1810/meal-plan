import { useSwipeable } from "react-swipeable";
import { Trash2 } from "lucide-react";
import { Plus, Minus } from "lucide-react";
import { Check, ShoppingBasket } from "lucide-react";

const IngredientInCart = ({
  ingredient,
  selectedStore,
  swipedItem,
  setSwipedItem,
  onDelete,
  onAmountChange,
  onPriceChange,
  onToggleCart,
  onMarkUnavailable,
}) => {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => setSwipedItem(ingredient.id),
    onSwipedRight: () => setSwipedItem(null),
    trackMouse: true,
    preventScrollOnSwipe: true,
  });

  return (
    <div className="relative overflow-hidden my-2 rounded">
      {/* Fondo rojo con botón de borrar */}
      <button
        onClick={() => onDelete(ingredient.id)}
        className="absolute right-0 top-0 bottom-0 bg-red-500 text-white px-5 font-bold m-2 rounded"
      >
        <Trash2 className="w-6 h-6" />
      </button>

      {/* Card del ingrediente */}
      <div
        {...swipeHandlers}
        className="gap-2 items-center p-4 shadow-md rounded bg-white transition-transform duration-200"
        style={{
          transform:
            swipedItem === ingredient.id
              ? "translateX(-80px)"
              : "translateX(0)",
        }}
      >
        <div className="flex justify-between items-center">
          <p className="text-lg font-medium">{ingredient.name}</p>
          {ingredient.favorite_store?.id &&
            ingredient.favorite_store?.id !== selectedStore && (
              <p className="text-[var(--text-favorite-store-color)] bg-[var(--favorite-store-color)] px-3 rounded-full">
                {ingredient.favorite_store?.name}
              </p>
            )}
        </div>
        <div className="flex gap-2 items-center justify-between">
          <div className="flex gap-2">
            <div className="flex items-center gap-2">
              <button
                className="bg-red-600 text-white p-1 rounded-full"
                onClick={() => onAmountChange(ingredient.id, -1)}
              >
                <Minus className="w-4 h-4" />
              </button>
              {ingredient.amount}
              <button
                className="bg-green-600 text-white p-1 rounded-full"
                onClick={() => onAmountChange(ingredient.id, 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
              ud/s
            </div>
            <div className="flex items-center gap-2">
              <input
                className="border border-[var(--input)] text-end px-2 w-13"
                type="number"
                value={ingredient.storePrice || 0}
                onChange={(e) =>
                  onPriceChange(ingredient.id, parseFloat(e.target.value) || 0)
                }
                step="0.01"
              />
              €
            </div>
          </div>
          <div className="flex items-center gap-2 ">
            {ingredient.storePrice === 0 || ingredient.storePrice === null ? (
              <button
                onClick={() => onMarkUnavailable(ingredient.id)}
                className=" px-2 rounded bg-[var(--urgente)]/40 text-[var(--urgente)]"
              >
                Marcar no disponible
              </button>
            ) : (
              <button
                className="p-2 rounded"
                onClick={() => onToggleCart(ingredient.id)}
              >
                {ingredient.addedToCart ? (
                  <div className="flex p-2 rounded items-center gap-1.5 bg-[var(--button-added-color)] text-white ">
                    <Check className="w-4 h-4" /> Añadido
                  </div>
                ) : (
                  <div className="flex p-2 rounded items-center gap-1.5 bg-[var(--button-color)] text-white">
                    <ShoppingBasket className="w-4 h-4" strokeWidth={1.5} />{" "}
                    Añadir
                  </div>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IngredientInCart;
