"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useReducer,
  useRef,
} from "react";
import { type FetchProductsByIds, fetchProductsByIds } from "@/lib/api/browser";
import {
  type CartLine,
  type CartState,
  cartReducer,
  emptyCart,
  getCartCount,
  mergeCarts,
} from "@/lib/cart";
import {
  type CartLineView,
  type CartStatus,
  type ProductRegistry,
  type RegistryAction,
  emptyRegistry,
  registryReducer,
  selectLines,
  selectSummary,
} from "@/lib/cart-products";
import { loadCart, saveCart } from "@/lib/cart-storage";
import type { Product } from "@/types/product";

/** Публичный интерфейс корзины для клиентских компонентов. */
type CartContextValue = {
  /** Позиции в том виде, в каком они хранятся (productId + quantity) */
  items: readonly CartLine[];
  /** Позиции вместе с тем, что известно о товаре: цена, недоступность, загрузка, ошибка */
  lines: readonly CartLineView[];
  /** Всего единиц товаров */
  count: number;
  /** Сумма доступных позиций по данным справочника, грн. Итоговой считается при `totalReliable` */
  total: number;
  totalReliable: boolean;
  /**
   * true, когда сохранённая корзина восстановлена. До этого `items` пустой
   * только потому, что данные ещё не прочитаны: не показывайте «Корзина пуста»
   * и счётчик «0», пока `isReady === false`. Добавлять товары можно и раньше:
   * при восстановлении они будут объединены с сохранёнными.
   */
  isReady: boolean;
  /** restoring → loading → ready | error, см. CartStatus */
  status: CartStatus;
  hasUnavailable: boolean;
  /** Можно ли оформлять заказ: всё проверено API и недоступных позиций нет */
  canCheckout: boolean;
  /** `product` — данные карточки: корзина покажет позицию сразу, а проверит её при открытии/оформлении */
  add: (productId: string, product?: Product) => void;
  increment: (productId: string) => void;
  decrement: (productId: string) => void;
  remove: (productId: string) => void;
  clear: () => void;
  /** Перепроверить цены и доступность всех позиций одним пакетным запросом. Безопасно вызывать часто. */
  refresh: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

// Внутреннее состояние провайдера: корзина + флаг восстановления + справочник товаров.
// Корзина и справочник — разные данные: ответ API меняет только справочник.
type ProviderState = { cart: CartState; isReady: boolean; registry: ProductRegistry };
type ProviderAction =
  | Exclude<Parameters<typeof cartReducer>[1], { type: "hydrate" }>
  | { type: "restore"; stored: CartState }
  | RegistryAction;

const initialState: ProviderState = { cart: emptyCart, isReady: false, registry: emptyRegistry };

function providerReducer(state: ProviderState, action: ProviderAction): ProviderState {
  switch (action.type) {
    case "restore":
      // Пользователь мог успеть добавить товар до восстановления: не затираем, а объединяем
      return {
        ...state,
        cart: cartReducer(state.cart, {
          type: "hydrate",
          state: mergeCarts(action.stored, state.cart),
        }),
        isReady: true,
      };

    case "seed":
    case "request":
    case "response":
    case "failure": {
      const registry = registryReducer(state.registry, action);
      return registry === state.registry ? state : { ...state, registry };
    }

    default: {
      const cart = cartReducer(state.cart, action);
      // No-op действие: возвращаем прежний объект, React пропустит перерисовку
      return cart === state.cart ? state : { ...state, cart };
    }
  }
}

type CartProviderProps = {
  children: ReactNode;
  /** Пакетная загрузка товаров по id. По умолчанию — браузерный клиент NestJS API; в тестах подменяется. */
  fetchProducts?: FetchProductsByIds;
};

export function CartProvider({ children, fetchProducts = fetchProductsByIds }: CartProviderProps) {
  // Начальное состояние одинаково на сервере и при первом клиентском рендере:
  // localStorage здесь не читается, поэтому hydration mismatch невозможен.
  const [{ cart, isReady, registry }, dispatch] = useReducer(providerReducer, initialState);

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
  // перезаписала бы сохранённую. Запись зависит только от корзины: ответы и ошибки API
  // её не затрагивают, поэтому временный сбой сервера не стирает сохранённые позиции.
  useEffect(() => {
    if (isReady) saveCart(cart);
  }, [cart, isReady]);

  // 3) Загрузка товаров. inflight — id, по которым запрос уже идёт: повторный вызов (Strict Mode,
  // быстрые клики, открытие корзины сразу после перехода на checkout) не создаёт дубль запроса.
  const inflightRef = useRef(new Set<string>());
  const seqRef = useRef(0);

  const load = useCallback(
    (ids: readonly string[]) => {
      const toLoad = [...new Set(ids)].filter((id) => !inflightRef.current.has(id));
      if (toLoad.length === 0) return;

      toLoad.forEach((id) => inflightRef.current.add(id));
      const seq = ++seqRef.current;
      dispatch({ type: "request", ids: toLoad });

      void (async () => {
        try {
          const result = await fetchProducts(toLoad);
          dispatch({ type: "response", ids: toLoad, seq, result });
        } catch {
          // Ошибка только помечает id как непроверенные; корзина и localStorage не меняются
          dispatch({ type: "failure", ids: toLoad });
        } finally {
          toLoad.forEach((id) => inflightRef.current.delete(id));
        }
      })();
    },
    [fetchProducts],
  );

  // Актуальные позиции для стабильного refresh(): он вызывается из эффектов дочерних
  // компонентов и не должен менять идентичность при каждом изменении корзины.
  const itemsRef = useRef(cart.items);
  const isReadyRef = useRef(isReady);
  useLayoutEffect(() => {
    itemsRef.current = cart.items;
    isReadyRef.current = isReady;
  });

  const refresh = useCallback(() => {
    if (!isReadyRef.current) return;
    load(itemsRef.current.map((item) => item.productId));
  }, [load]);

  // Позиции, о которых справочник ничего не знает, догружаются одним пакетным запросом.
  // Позиции с ошибкой автоматически не перезапрашиваются (иначе цикл при недоступном API):
  // только refresh() — по действию пользователя, при открытии корзины и на checkout.
  useEffect(() => {
    if (!isReady) return;
    const unknown = cart.items
      .map((item) => item.productId)
      .filter((id) => !registry.entries[id] && !registry.failed[id]);
    load(unknown);
  }, [isReady, cart.items, registry.entries, registry.failed, load]);

  const value = useMemo<CartContextValue>(() => {
    const lines = selectLines(cart, registry);
    const summary = selectSummary(cart, isReady, lines, registry);
    return {
      items: cart.items,
      lines,
      count: getCartCount(cart),
      total: summary.total,
      totalReliable: summary.totalReliable,
      isReady,
      status: summary.status,
      hasUnavailable: summary.hasUnavailable,
      canCheckout: summary.canCheckout,
      add: (productId, product) => {
        if (product) dispatch({ type: "seed", product });
        dispatch({ type: "add", productId });
      },
      increment: (productId) => dispatch({ type: "increment", productId }),
      decrement: (productId) => dispatch({ type: "decrement", productId }),
      remove: (productId) => dispatch({ type: "remove", productId }),
      clear: () => dispatch({ type: "clear" }),
      refresh,
    };
  }, [cart, registry, isReady, refresh]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart нужно вызывать внутри <CartProvider>");
  }
  return context;
}
