"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

interface AddModalContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const AddModalContext = createContext<AddModalContextValue | null>(null);

export function AddModalProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <AddModalContext.Provider value={{ open, setOpen }}>
      {children}
    </AddModalContext.Provider>
  );
}

export function useAddModal() {
  const ctx = useContext(AddModalContext);

  if (!ctx) {
    throw new Error("useAddModal must be used inside AddModalProvider");
  }

  return ctx;
}
