// components/ui/Button.tsx
import type { ButtonHTMLAttributes, ReactNode } from "react";

type ButtonVariant = "primary" | "outline";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  variant?: ButtonVariant;
};

export default function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: ButtonProps) {
  const base =
    "h-12 px-10 rounded-full text-sm font-semibold transition inline-flex items-center justify-center select-none";

  const styles =
    variant === "primary"
      ? "bg-[#1F2937] text-white hover:opacity-90"
      : "bg-white border border-zinc-900 text-zinc-900 hover:bg-zinc-900 hover:text-[#1F2937]";

  return (
    <button className={`${base} ${styles} ${className}`} {...props}>
      {children}
    </button>
  );
}