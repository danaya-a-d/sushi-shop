type IconProps = {
  className?: string;
};

/**
 * Бургер из Figma: две чёрные линии (31,5 × 2,8 в планшетном макете), более
 * длинная фиолетовая (41 × 2,8) посередине, шаг линий 9,46.
 * Линии — заливки (rect), а размер SVG задаётся классами: при растяжении
 * до мобильного размера (32,2 × 16,1) толщина и шаг получаются 2,1 и 7,0,
 * как в мобильном макете, без `transform: scale()`.
 */
export function BurgerIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 41 21.77"
      preserveAspectRatio="none"
      aria-hidden="true"
      className={className}
    >
      <rect width="31.47" height="2.84" fill="#150d1d" />
      <rect y="9.46" width="41" height="2.84" fill="#a883c9" />
      <rect y="18.93" width="31.47" height="2.84" fill="#150d1d" />
    </svg>
  );
}

export function CloseIcon({ className }: IconProps) {
  return (
    <svg
      viewBox="0 0 30 30"
      fill="none"
      stroke="#a883c9"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <path d="M2 2l26 26M28 2L2 28" />
    </svg>
  );
}
