// components/ui/button.tsx
import React from "react";

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
  const variantClasses =
    variant === "destructive"
      ? "bg-red-600 hover:bg-red-700 text-white"
      : variant === "ghost"
      ? "bg-transparent text-gray-700 hover:bg-gray-200"
      : variant === "outline"
      ? "border border-gray-300 text-gray-700 hover:bg-gray-100"
      : variant === "secondary"
      ? "bg-gray-100 text-gray-800 hover:bg-gray-200" // ✅ added
      : "bg-blue-600 hover:bg-blue-700 text-white"; // default

  const sizeClasses =
    size === "sm"
      ? "px-3 py-1 text-sm"
      : size === "lg"
      ? "px-5 py-3 text-lg"
      : "px-4 py-2 text-base";

  return (
    <button
      className={`rounded-md transition-colors ${variantClasses} ${sizeClasses} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
