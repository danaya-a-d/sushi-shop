import Image from "next/image";
import Link from "next/link";

type LogoProps = {
  className?: string;
};

export function Logo({ className = "" }: LogoProps) {
  return (
    <Link
      href="/"
      aria-label="I love Sushi — на главную"
      className={`block ${className}`}
    >
      <Image
        src="/icons/logo.svg"
        alt="I love Sushi"
        width={157}
        height={55}
        className="h-auto w-[98px] md:w-[129px] lg:w-[156px]"
      />
    </Link>
  );
}
