import Link from "next/link";
import type { ComponentPropsWithoutRef } from "react";

type Variant = "primary" | "secondary";
type Size = "l" | "s";

const base =
  "inline-flex items-center justify-center rounded-full font-heading whitespace-nowrap transition-ui";

const variants: Record<Variant, string> = {
  primary:
    "bg-primary text-on-accent hover:bg-primary-hover focus-visible:bg-primary-hover",
  secondary:
    "bg-accent text-on-accent hover:bg-accent-hover focus-visible:bg-accent-hover",
};

// L: 250×67 / Gabriela 24 (на mobile — вариант M: 190×54 / 20).
// S: «Купить» 110×44 / 20 (на mobile — 32 px по высоте / 16).
const sizes: Record<Size, string> = {
  l: "h-[54px] min-w-[190px] px-4 text-xl md:h-[67px] md:min-w-[250px] md:px-[22px] md:text-2xl",
  s: "h-8 px-3 text-base md:h-11 md:min-w-[110px] md:px-[22px] md:text-xl",
};

type CommonProps = {
  variant?: Variant;
  size?: Size;
};

type ButtonAsLink = CommonProps &
  Omit<ComponentPropsWithoutRef<typeof Link>, "className"> & {
    className?: string;
  };

type ButtonAsButton = CommonProps &
  Omit<ComponentPropsWithoutRef<"button">, "className"> & {
    href?: undefined;
    className?: string;
  };

export function Button(props: ButtonAsLink | ButtonAsButton) {
  const { variant = "primary", size = "l", className = "", ...rest } = props;
  const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`;

  if (rest.href !== undefined) {
    return <Link className={classes} {...(rest as ButtonAsLink)} />;
  }

  const { type = "button", ...buttonProps } = rest as ButtonAsButton;
  return <button type={type} className={classes} {...buttonProps} />;
}
