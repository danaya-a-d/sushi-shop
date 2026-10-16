import { type ComponentPropsWithRef, type ReactNode, useId } from "react";

/**
 * Поля формы оформления заказа. Компоненты только рисуют: значения и ошибки
 * приходят из React Hook Form (`{...register("name")}` + `error`).
 * В макете у полей нет видимых подписей, только placeholder, поэтому доступное
 * имя задаёт aria-label.
 */

// Радиус не входит в общую часть: две конфликтующие утилиты (rounded-full и rounded-3xl) в одном
// className побеждают не по порядку записи, а по порядку в сгенерированном CSS.
const fieldBase =
  "w-full border bg-lime px-5 text-base text-ink placeholder:text-ink/70 md:text-2xl lg:max-xl:text-xl";
const fieldBorder = "border-primary";
const fieldBorderInvalid = "border-error";

type TextFieldProps = Omit<ComponentPropsWithRef<"input">, "aria-label"> & {
  /** Доступное имя поля (видимого label в макете нет) */
  label: string;
  error?: string;
};

export function TextField({
  label,
  error,
  className = "",
  ...inputProps
}: TextFieldProps) {
  const errorId = useId();

  return (
    <div className={className}>
      <input
        {...inputProps}
        placeholder={label}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldBase} h-12 rounded-full md:h-[67px] ${error ? fieldBorderInvalid : fieldBorder}`}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

type TextAreaFieldProps = Omit<ComponentPropsWithRef<"textarea">, "aria-label"> & {
  label: string;
  error?: string;
};

/**
 * Многострочное поле: начальная высота вдвое больше обычного поля, тянется только по вертикали.
 * Радиус постоянный (24 px на mobile, 34 px с md, как половина высоты обычного поля) и не зависит от высоты.
 */
export function TextAreaField({
  label,
  error,
  className = "",
  ...textareaProps
}: TextAreaFieldProps) {
  const errorId = useId();

  return (
    <div className={className}>
      <textarea
        {...textareaProps}
        placeholder={label}
        aria-label={label}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? errorId : undefined}
        className={`${fieldBase} block h-24 min-h-24 resize-y rounded-3xl py-3 leading-[1.3] md:h-[134px] md:min-h-[134px] md:rounded-[34px] md:py-5 ${error ? fieldBorderInvalid : fieldBorder}`}
      />
      {error && <FieldError id={errorId}>{error}</FieldError>}
    </div>
  );
}

function FieldError({ id, children }: { id: string; children: ReactNode }) {
  return (
    <p id={id} className="mt-2 px-5 text-sm leading-[1.3] text-error md:text-base">
      {children}
    </p>
  );
}

type RadioOptionProps = Omit<ComponentPropsWithRef<"input">, "type" | "children"> & {
  label: ReactNode;
  /** Пояснение под названием, например почему вариант недоступен */
  note?: string;
};

/** Радиокнопка с подписью: клик по тексту тоже выбирает вариант. */
export function RadioOption({ label, note, disabled, ...inputProps }: RadioOptionProps) {
  const noteId = useId();

  return (
    <div>
      <label
        className={`flex items-center gap-2.5 text-base leading-[1.3] md:gap-3 md:text-2xl ${
          disabled ? "cursor-default opacity-50" : "cursor-pointer"
        }`}
      >
        <input
          {...inputProps}
          type="radio"
          disabled={disabled}
          aria-describedby={note ? noteId : undefined}
          className="radio-field"
        />
        <span>{label}</span>
      </label>
      {note && (
        <p id={noteId} className="mt-1 pl-[30px] text-xs leading-[1.3] opacity-60 md:pl-8 md:text-sm">
          {note}
        </p>
      )}
    </div>
  );
}
