"use client";

import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import {
  type CartLine,
  type CartState,
  cartReducer,
  emptyCart,
  getCartCount,
  getCartTotal,
  mergeCarts,
} from "@/lib/cart";
import { loadCart, saveCart } from "@/lib/cart-storage";

/** Публичный интерфейс корзины для клиентских компонентов. */
type CartContextValue = {
  items: readonly CartLine[];
  /** Всего единиц товаров */
  count: number;
  /** Итог по актуальным ценам каталога, грн */
  total: number;
  /**
   * true, когда сохранённая корзина восстановлена. До этого `items` пустой
   * только потому, что данные ещё не прочитаны: не показывайте «Корзина пуста»
   * и счётчик «0», пока `isReady === false`. Добавлять товары можно и раньше:
   * при восстановлении они будут объединены с сохранёнными.
   */
  isReady: boolean;
  add: (productId: string) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Внутреннее состояние провайдера: корзина + флаг восстановления.
// Флаг лежит рядом с корзиной, чтобы они менялись одним атомарным обновлением.
type ProviderState = { cart: CartState; isReady: boolean };
type ProviderAction =
  | Exclude<Parameters<typeof cartReducer>[1], { type: "hydrate" }>
  | { type: "restore"; stored: CartState };

const initialState: ProviderState = { cart: emptyCart, isReady: false };

function providerReducer(state: ProviderState, action: ProviderAction): ProviderState {
  if (action.type === "restore") {
    // Пользователь мог успеть добавить товар до восстановления: не затираем, а объединяем
    const merged = mergeCarts(action.stored, state.cart);
    return {
      cart: cartReducer(state.cart, { type: "hydrate", state: merged }),
      isReady: true,
    };
  }
  return { ...state, cart: cartReducer(state.cart, action) };
}

export function CartProvider({ children }: { children: ReactNode }) {
  // Начальное состояние одинаково на сервере и при первом клиентском рендере:
  // localStorage здесь не читается, поэтому hydration mismatch невозможен.
  const [{ cart, isReady }, dispatch] = useReducer(providerReducer, initialState);

  // 1) Восстановление: один раз после монтирования (эффекты выполняются только в браузере).
  // Ref защищает от повторного запуска в React Strict Mode (dev): иначе сохранённые
  // количества объединились бы сами с собой.
  const restoredRef = useRef(false);
  useEffect(() => {
    if (restoredRef.current) return;
    restoredRef.current = true;
    dispatch({ type: "restore", stored: loadCart() });
  }, []);

  // 2) Сохранение: только после восстановления, иначе стартовая пустая корзина
  // перезаписала бы сохранённую.
  useEffect(() => {
    if (isReady) saveCart(cart);
  }, [cart, isReady]);

  const value = useMemo<CartContextValue>(
    () => ({
      items: cart.items,
      count: getCartCount(cart),
      total: getCartTotal(cart),
      isReady,
      add: (productId) => dispatch({ type: "add", productId }),
      increment: (productId) => dispatch({ type: "increment", productId }),
      decrement: (productId) => dispatch({ type: "decrement", productId }),
      remove: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
    }),
    [cart, isReady],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart нужно вызывать внутри <CartProvider>");
  }
  return context;
}
