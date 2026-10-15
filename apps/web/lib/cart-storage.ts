import { type CartState, emptyCart, sanitizeCart } from "@/lib/cart";

// Работа с localStorage. Модуль безопасно импортируется на сервере: к `window`
// обращаются только функции, и только когда их вызывают (в браузере, в эффекте).

export const CART_STORAGE_KEY = "sushi-shop:cart:v1";

/** Минимум, который нужен от Storage: удобно подставлять в тестах. */
export type CartStorage = Pick<Storage, "getItem" | "setItem">;

/** Доступ к localStorage может бросить исключение (запрет cookies, приватный режим). */
function getBrowserStorage(): CartStorage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

/** Читает корзину. При любой проблеме (нет данных, битый JSON, ошибка) — пустая корзина. */
export function loadCart(storage: CartStorage | null = getBrowserStorage()): CartState {
  if (!storage) return emptyCart;

  try {
    const raw = storage.getItem(CART_STORAGE_KEY);
    if (raw === null) return emptyCart;
    return sanitizeCart(JSON.parse(raw));
  } catch {
    return emptyCart;
  }
}

/**
 * Сохраняет только productId и quantity. Возвращает false, если записать не
 * удалось (хранилище недоступно или переполнено): корзина живёт в памяти.
 */
export function saveCart(
  state: CartState,
  storage: CartStorage | null = getBrowserStorage(),
): boolean {
  if (!storage) return false;

  try {
    const items = state.items.map(({ productId, quantity }) => ({
      productId,
      quantity,
    }));
    storage.setItem(CART_STORAGE_KEY, JSON.stringify({ items }));
    return true;
  } catch {
    return false;
  }
}
