import type { ElementType, ReactNode } from "react";

type ContainerProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
};

/** Контент 1290 px по центру + боковые поля 20 px. */
export function Container({
  children,
  as: Tag = "div",
  className = "",
}: ContainerProps) {
  return (
    <Tag className={`mx-auto w-full max-w-[1330px] px-5 ${className}`}>
      {children}
    </Tag>
  );
}
