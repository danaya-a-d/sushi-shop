import type { ElementType, ReactNode } from "react";

type SectionTitleProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/** Заголовок секции с лавандовой подсветкой нижней половины строки. */
export function SectionTitle({
  children,
  as: Tag = "h2",
  className = "",
}: SectionTitleProps) {
  return (
    <Tag
      className={`font-heading text-[32px] leading-none md:text-5xl ${className}`}
    >
      <span className="highlight">{children}</span>
    </Tag>
  );
}
