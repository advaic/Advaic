// components/ui/button.tsx
import React from "react";
import {
  AppButton,
  type AppButtonSize,
  type AppButtonVariant,
} from "@/components/app-ui";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "destructive" | "ghost" | "outline" | "secondary"; // ✅ added
  size?: "sm" | "default" | "lg";
};

export function Button({
  children,
  variant = "default",
  size = "default",
  className = "",
  ...props
}: ButtonProps) {
  const mappedVariant: AppButtonVariant =
    variant === "destructive"
      ? "destructive"
      : variant === "ghost"
        ? "utility"
        : variant === "outline"
          ? "secondary"
          : variant === "secondary"
            ? "utility"
            : "primary";

  const mappedSize: AppButtonSize =
    size === "sm" ? "sm" : size === "lg" ? "lg" : "md";

  return (
    <AppButton
      variant={mappedVariant}
      size={mappedSize}
      className={className}
      {...props}
    >
      {children}
    </AppButton>
  );
}
