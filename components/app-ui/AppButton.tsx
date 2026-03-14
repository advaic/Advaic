import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type AppButtonVariant =
  | "primary"
  | "secondary"
  | "tertiary"
  | "utility"
  | "destructive";

export type AppButtonSize = "chip" | "sm" | "md" | "lg";

type AppButtonClassOptions = {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
  className?: string;
};

const variantClasses: Record<AppButtonVariant, string> = {
  primary:
    "border-gray-900 bg-gray-900 text-amber-200 hover:bg-gray-800 hover:border-gray-900",
  secondary:
    "border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-300",
  tertiary:
    "border-amber-200 bg-white text-amber-900 hover:bg-amber-50 hover:border-amber-300",
  utility:
    "border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:border-gray-300",
  destructive:
    "border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:border-red-300",
};

const sizeClasses: Record<AppButtonSize, string> = {
  chip: "min-h-11 rounded-full px-3.5 py-2 text-xs",
  sm: "min-h-11 rounded-lg px-3.5 py-2 text-sm",
  md: "min-h-11 rounded-lg px-4 py-2.5 text-sm",
  lg: "min-h-12 rounded-xl px-4 py-3 text-sm",
};

export function appButtonClass({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
}: AppButtonClassOptions = {}) {
  return cn(
    "app-focusable inline-flex items-center justify-center gap-2 border font-medium leading-none transition-colors duration-150 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-60",
    variantClasses[variant],
    sizeClasses[size],
    fullWidth && "w-full",
    className,
  );
}

type AppButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  fullWidth?: boolean;
};

export default function AppButton({
  variant = "secondary",
  size = "md",
  fullWidth = false,
  className,
  ...props
}: AppButtonProps) {
  return (
    <button
      className={appButtonClass({ variant, size, fullWidth, className })}
      {...props}
    />
  );
}
