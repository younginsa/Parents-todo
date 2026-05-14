import { format } from "date-fns";

export const APP_NAME = "Readably";
export const STORAGE_KEY = "readably-demo-state-v4";
export const DEMO_TODAY = format(new Date(), "yyyy-MM-dd");
export const DEFAULT_LOCALE = "ko";

export const BIRTHDAYS: Array<{ name: string; month: number; day: number }> = [
  { name: "Yiseoup", month: 5, day: 24 },
  { name: "Wooseoup", month: 5, day: 28 },
];

export const isDemoMode =
  !process.env.NEXT_PUBLIC_BACKEND_URL || !process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
