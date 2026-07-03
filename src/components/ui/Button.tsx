import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: "bg-court-bright text-ink active:bg-court",
  secondary:
    "bg-ink-overlay text-line border border-hairline active:bg-ink-raised",
  danger: "bg-bench/15 text-bench border border-bench/40 active:bg-bench/25",
  ghost: "bg-transparent text-line-dim active:bg-ink-overlay",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  fullWidth?: boolean;
}

export function Button({
  variant = "primary",
  fullWidth,
  className = "",
  ...props
}: ButtonProps) {
  return (
    <button
      className={`min-h-11 rounded-xl px-4 text-[15px] font-semibold transition-colors disabled:opacity-40 ${VARIANT_CLASSES[variant]} ${fullWidth ? "w-full" : ""} ${className}`}
      {...props}
    />
  );
}
