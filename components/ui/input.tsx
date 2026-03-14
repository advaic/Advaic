import React from "react";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="app-field w-full rounded-lg border px-3 py-2 text-sm shadow-sm"
      {...props}
    />
  );
}
