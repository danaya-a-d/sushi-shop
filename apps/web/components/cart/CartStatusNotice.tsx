import { Button } from "@/components/ui/Button";
import type { CartStatus } from "@/lib/cart-products";

type CartStatusNoticeProps = {
  status: CartStatus;
  hasUnavailable: boolean;
  onRetry: () => void;
  className?: string;
};

/**
 * Сообщение о состоянии данных корзины: ошибка API (с повтором) или недоступные товары.
 * Когда всё в порядке, ничего не рисует. role="alert" озвучивает появление.
 */
export function CartStatusNotice({
  status,
  hasUnavailable,
  onRetry,
  className = "",
}: CartStatusNoticeProps) {
  if (status === "error") {
    return (
      <div role="alert" className={`rounded-[30px] bg-lavender px-5 py-4 ${className}`}>
        <p className="text-base leading-[1.3] md:text-xl">
          Не удалось проверить цены и наличие товаров. Ваша корзина сохранена. Оформить заказ
          можно после успешной проверки.
        </p>
        <Button type="button" size="s" onClick={onRetry} className="mt-3">
          Повторить
        </Button>
      </div>
    );
  }

  if (hasUnavailable) {
    return (
      <p role="alert" className={`rounded-[30px] bg-lavender px-5 py-4 text-base leading-[1.3] md:text-xl ${className}`}>
        Некоторые товары больше недоступны. Удалите их из корзины, чтобы оформить заказ.
      </p>
    );
  }

  return null;
}
