type MaskIconProps = {
  src: string;
  className?: string;
};

/**
 * Одноцветная SVG-иконка из `public/icons`, окрашиваемая через `currentColor`
 * (hover/focus можно менять обычным text-цветом). Декоративная: подпись
 * задаёт родительская ссылка или кнопка.
 */
export function MaskIcon({ src, className = "" }: MaskIconProps) {
  return (
    <span
      aria-hidden="true"
      className={`block bg-current ${className}`}
      style={{
        maskImage: `url(${src})`,
        maskRepeat: "no-repeat",
        maskPosition: "center",
        maskSize: "contain",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        WebkitMaskSize: "contain",
      }}
    />
  );
}
