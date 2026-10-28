"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { CartLineItem } from "@/components/cart/CartLineItem";
import { useCart } from "@/components/cart/CartProvider";
import { CartStatusNotice } from "@/components/cart/CartStatusNotice";
import { Button } from "@/components/ui/Button";
import {
  type CheckoutFormValues,
  checkoutDefaultValues,
  checkoutSchema,
  deliveryOptions,
  getDeliveryFee,
  paymentOptions,
} from "@/lib/checkout-schema";
import { formatPrice } from "@/lib/format-price";
import { majorToMinorUnits, minorUnitsToMajor } from "@/lib/money";
import { RadioOption, TextAreaField, TextField } from "./fields";
import { checkoutHeading } from "./styles";

type CheckoutFormProps = {
  /** Серверный блок «Может понравиться»: передаётся готовым, чтобы остаться серверным компонентом */
  recommended: ReactNode;
};

const SUBMIT_NOTICE =
  "Форма заполнена корректно. Отправка заказа станет доступна после подключения сервера.";

// Раздел формы: на tablet колонка полей 630 px (как в макете), на mobile и desktop занимает всю ширину колонки
const fieldsetClass = "min-w-0 md:max-w-[630px] lg:max-w-none";

/**
 * Оформление заказа. Корзина берётся из CartProvider (не копируется), значения
 * формы живут в React Hook Form, а их проверка описана Zod-схемой.
 */
export function CheckoutForm({ recommended }: CheckoutFormProps) {
  const {
    lines,
    total,
    totalKnown,
    status,
    hasUnavailable,
    canCheckout,
    isReady,
    increment,
    decrement,
    remove,
    refresh,
  } = useCart();

  // Переход на checkout перепроверяет цены и наличие одним пакетным запросом
  // (если запрос уже идёт, например после загрузки страницы, повторный не создаётся)
  useEffect(() => {
    if (isReady) refresh();
  }, [isReady, refresh]);

  const {
    register,
    handleSubmit,
    control,
    clearErrors,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: checkoutDefaultValues,
  });

  // useWatch подписывает на одно поле: форма перерисуется при смене доставки, но не на каждый ввод в других полях
  const delivery = useWatch({ control, name: "delivery" });
  const isCourier = delivery === "courier";

  const [notice, setNotice] = useState(false);

  // Удалили позицию, на которой стоял фокус: кнопка исчезла, фокус «упал» на body.
  // Возвращаем его на заголовок раздела (в пустом состоянии он тоже есть).
  const headingRef = useRef<HTMLHeadingElement>(null);
  const lineCount = lines.length;
  const previousLines = useRef(lineCount);
  useEffect(() => {
    if (lineCount < previousLines.current && document.activeElement === document.body) {
      headingRef.current?.focus();
    }
    previousLines.current = lineCount;
  }, [lineCount]);

  // Пока корзина читается из localStorage, items пустой лишь потому, что данные ещё не прочитаны:
  // «Корзина пуста» показывать нельзя. Сервер и первый клиентский рендер совпадают (isReady = false).
  if (!isReady) {
    return (
      <div aria-busy="true" className="min-h-[50vh]">
        <p role="status" className="sr-only">
          Загружаем корзину…
        </p>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="flex flex-col items-center pt-10 pb-20 text-center md:pt-[60px] md:pb-[140px] lg:pb-0">
        <h2
          ref={headingRef}
          tabIndex={-1}
          className="font-heading text-[28px] leading-[1.3] outline-none md:text-4xl"
        >
          Корзина пуста
        </h2>
        <p className="mt-4 max-w-[420px] text-base leading-[1.3] md:text-xl">
          Добавьте роллы и суши из меню, чтобы оформить заказ.
        </p>
        <Button href="/catalog" className="mt-8 md:mt-10">
          Вернуться в меню
        </Button>
      </div>
    );
  }

  // Итог считается при каждом рендере из актуальной корзины и выбранной доставки,
  // в состоянии он не хранится: при смене доставки пересчитывается сам.
  const orderTotal = minorUnitsToMajor(majorToMinorUnits(total) + majorToMinorUnits(getDeliveryFee(delivery)));

  // Здесь будет отправка заказа на сервер. Пока backend нет: данные не сохраняются,
  // корзина не очищается, переход на другую страницу не выполняется.
  // Недоступные позиции или непроверенные цены оформлению мешают (кнопка к тому же заблокирована).
  const onValid = () => {
    if (canCheckout) setNotice(true);
  };

  return (
    <form
      noValidate
      onSubmit={handleSubmit(onValid)}
      // изменение любого поля скрывает устаревшее сообщение об успешной проверке
      onChange={() => setNotice(false)}
      // Mobile и tablet: одна колонка. С lg: слева форма, справа оплата и итог, ниже рекомендации
      className="grid grid-cols-[minmax(0,1fr)] gap-y-[60px] md:gap-y-[70px] lg:grid-cols-[minmax(0,630fr)_minmax(0,520fr)] lg:grid-rows-[auto_1fr_auto] lg:gap-x-10 lg:gap-y-0 xl:gap-x-[140px]"
    >
      <div className="flex flex-col gap-[60px] md:gap-[70px] lg:col-start-1 lg:row-span-2 lg:row-start-1">
        <section aria-labelledby="checkout-items-title" className="lg:order-last">
          <h2
            id="checkout-items-title"
            ref={headingRef}
            tabIndex={-1}
            className={`${checkoutHeading} outline-none`}
          >
            Ваш заказ
          </h2>
          <CartStatusNotice
            status={status}
            hasUnavailable={hasUnavailable}
            onRetry={refresh}
            className="mb-5 md:mb-[30px]"
          />
          <ul className="flex flex-col gap-5 md:gap-10 lg:gap-[30px]">
            {lines.map((line) => (
              <CartLineItem
                key={line.productId}
                line={line}
                onIncrement={() => increment(line.productId)}
                onDecrement={() => decrement(line.productId)}
                onRemove={() => remove(line.productId)}
              />
            ))}
          </ul>
        </section>

        <fieldset className={fieldsetClass}>
          <legend className={checkoutHeading}>Личные данные</legend>
          <div className="grid gap-5 md:grid-cols-2">
            <TextField
              label="Имя и фамилия"
              autoComplete="name"
              error={errors.name?.message}
              {...register("name")}
            />
            <TextField
              label="Номер телефона"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              error={errors.phone?.message}
              {...register("phone")}
            />
          </div>
        </fieldset>

        <fieldset className={fieldsetClass}>
          <legend className={checkoutHeading}>Доставка</legend>
          <div className="flex flex-col gap-5">
            {deliveryOptions.map((option) => (
              <RadioOption
                key={option.value}
                value={option.value}
                label={
                  <>
                    {option.label}{" "}
                    <span className="text-accent">(+{formatPrice(option.fee)})</span>
                  </>
                }
                {...register("delivery", {
                  // Самовывоз: ошибки скрытых адресных полей больше не актуальны
                  onChange: (event) => {
                    if (event.target.value === "pickup") clearErrors(["street", "house"]);
                  },
                })}
              />
            ))}
          </div>
        </fieldset>

        {/* Комментарий нужен при любой доставке, адресные поля только курьеру.
            Скрытые поля размонтируются, но их значения остаются в форме и вернутся при выборе курьера */}
        <div className={`flex flex-col gap-5 md:gap-[30px] ${fieldsetClass}`}>
          {isCourier && (
            <fieldset className="min-w-0">
              <legend className={checkoutHeading}>Адрес доставки</legend>
              <div className="flex flex-col gap-5 md:gap-[30px]">
                <TextField
                  label="Улица"
                  autoComplete="address-line1"
                  error={errors.street?.message}
                  {...register("street")}
                />
                <div className="grid grid-cols-2 gap-5 md:grid-cols-[103fr_179fr_118fr_173fr] lg:grid-cols-2 xl:grid-cols-[103fr_179fr_118fr_173fr]">
                  <TextField label="Дом" error={errors.house?.message} {...register("house")} />
                  <TextField
                    label="Квартира"
                    error={errors.apartment?.message}
                    {...register("apartment")}
                  />
                  <TextField label="Этаж" error={errors.floor?.message} {...register("floor")} />
                  <TextField
                    label="Домофон"
                    error={errors.intercom?.message}
                    {...register("intercom")}
                  />
                </div>
              </div>
            </fieldset>
          )}
          <TextAreaField
            label="Комментарий к заказу"
            error={errors.comment?.message}
            {...register("comment")}
          />
        </div>
      </div>

      <fieldset className={`${fieldsetClass} lg:col-start-2 lg:row-start-1`}>
        <legend className={checkoutHeading}>Способ оплаты</legend>
        <div className="flex flex-col gap-5">
          {paymentOptions.map((option) => (
            <RadioOption
              key={option.value}
              value={option.value}
              label={option.label}
              {...register("payment")}
            />
          ))}
          {/* Онлайн-оплаты пока нет: вариант виден по макету, но выбрать его нельзя */}
          <RadioOption
            name="payment-online"
            value="card_online"
            label="Картой на сайте"
            note="Онлайн-оплата пока недоступна."
            disabled
          />
        </div>
      </fieldset>


      {/* В DOM «Итого» стоит перед рекомендациями: так порядок Tab совпадает с desktop.
          Mobile и tablet: order-last переносит полосу «Итого» вниз на всю ширину */}
      <div className="border-t border-accent pt-5 pb-[30px] max-lg:order-last max-lg:-mx-5 max-lg:mt-[30px] max-lg:px-5 md:pb-[60px] lg:col-start-2 lg:row-start-2 lg:mt-[43px] lg:self-start lg:pt-[27px] lg:pb-0">
        <h2 className="font-heading text-xl leading-[1.3] md:text-[32px]">Итого:</h2>

        {/* Промокод из макета: пока только отображение, как в корзине */}
        <div className="mt-5 lg:mt-[31px]">
          <div className="flex opacity-60">
            <input
              type="text"
              disabled
              placeholder="Промокод"
              aria-label="Промокод"
              aria-describedby="checkout-promo-note"
              className="h-12 min-w-0 flex-1 rounded-l-full border border-primary bg-lime px-5 text-base placeholder:text-ink/70 md:h-[67px] md:text-2xl"
            />
            <button
              type="button"
              disabled
              className="h-12 shrink-0 rounded-r-full bg-primary px-5 font-heading text-base text-on-accent md:h-[67px] md:px-10 md:text-2xl"
            >
              Применить
            </button>
          </div>
          <p id="checkout-promo-note" className="mt-2 text-xs opacity-60 md:text-sm">
            Промокоды появятся позже.
          </p>
        </div>

        <div className="mt-5 flex items-center justify-between gap-4 md:mt-[30px]">
          <p className="text-xl font-medium whitespace-nowrap md:text-4xl">
            {totalKnown ? formatPrice(orderTotal) : "—"}
          </p>
          <Button
            type="submit"
            disabled={!canCheckout}
            className="disabled:opacity-50 disabled:hover:bg-primary"
          >
            Оформить заказ
          </Button>
        </div>

        <div role="status">
          {status === "loading" && (
            <p className="mt-4 text-sm leading-[1.3] md:text-base">Проверяем цены и наличие товаров…</p>
          )}
          {notice && (
            <p className="mt-4 text-sm leading-[1.3] md:text-base">{SUBMIT_NOTICE}</p>
          )}
        </div>
      </div>

      <div className="lg:col-span-2 lg:row-start-3 lg:mt-[100px]">{recommended}</div>
    </form>
  );
}
