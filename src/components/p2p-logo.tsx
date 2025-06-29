import { cn } from "@/lib/utils";

export const P2PLogo = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={cn("text-primary", className)}
  >
    <path d="M8 3v13a4 4 0 0 0 4 4h7" />
    <path d="M8 3a4 4 0 0 1 4 4h0" />
    <path d="m19 16-4 4 4 4" />
  </svg>
);
