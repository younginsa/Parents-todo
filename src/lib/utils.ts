import { clsx, type ClassValue } from "clsx";
import { format, parseISO } from "date-fns";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function buildSourceLabel(title: string, baseDate: string) {
  return `${title}, ${format(parseISO(baseDate), "MMM d")} note`;
}
