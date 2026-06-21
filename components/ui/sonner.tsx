"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";

function Toaster(props: ToasterProps) {
  return (
    <Sonner
      theme="light"
      richColors
      closeButton
      position="bottom-right"
      {...props}
    />
  );
}

export { Toaster };
