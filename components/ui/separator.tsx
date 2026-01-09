// components/ui/separator.tsx
export function Separator({ className }: { className?: string }) {
  return <hr className={`border-border my-4 ${className || ""}`} />;
}
