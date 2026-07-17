import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function scoreColor(score) {
  if (score >= 80) return "text-emerald-500";
  if (score >= 60) return "text-amber-500";
  return "text-rose-500";
}

export function scoreStroke(score) {
  if (score >= 80) return "#10b981";
  if (score >= 60) return "#f59e0b";
  return "#f43f5e";
}

export function scoreLabel(score) {
  if (score >= 85) return "Excellent match";
  if (score >= 70) return "Strong match";
  if (score >= 50) return "Moderate match";
  return "Needs work";
}
