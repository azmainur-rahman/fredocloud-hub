"use client";

import { Toaster } from "react-hot-toast";

export default function Providers({ children }) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3500,
          style: {
            background: "#111827",
            border: "1px solid rgba(249, 115, 22, 0.35)",
            color: "#fff",
          },
          success: {
            iconTheme: {
              primary: "#f97316",
              secondary: "#111827",
            },
          },
        }}
      />
    </>
  );
}
