import React from "react";
import { cn } from "@/utils/cn";

export interface NavigationOverlayProps {
  readonly isOpen: boolean;
  readonly onClose: () => void;
}

export const NavigationOverlay: React.FC<NavigationOverlayProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div
      aria-hidden="true"
      onClick={onClose}
      className={cn(
        "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden animate-in fade-in"
      )}
    />
  );
};
