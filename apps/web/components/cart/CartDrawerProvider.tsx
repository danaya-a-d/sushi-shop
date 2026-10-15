"use client";

import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type CartDrawerContextValue = {
  isOpen: boolean;
  open: () => void;
  close: () => void;
};

const CartDrawerContext = createContext<CartDrawerContextValue | null>(null);

/**
 * Только «открыта ли панель корзины». Товары живут в CartProvider: открытие
 * Drawer не должно перерисовывать то, что зависит от корзины, и наоборот.
 * Сам <dialog> синхронизируется с этим флагом в CartDrawer.
 */
export function CartDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo(() => ({ isOpen, open, close }), [isOpen, open, close]);

  return (
    <CartDrawerContext.Provider value={value}>
      {children}
    </CartDrawerContext.Provider>
  );
}

export function useCartDrawer(): CartDrawerContextValue {
  const context = useContext(CartDrawerContext);
  if (!context) {
    throw new Error("useCartDrawer нужно вызывать внутри <CartDrawerProvider>");
  }
  return context;
}
