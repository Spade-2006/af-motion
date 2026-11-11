import React from "react";
import { cn } from "@/utils/cn";

export interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  readonly children: React.ReactNode;
  readonly columns?: 1 | 2 | 3 | 4;
  readonly gap?: "sm" | "md" | "lg" | "xl";
}

const COLUMNS_MAP = {
  1: "grid-cols-1",
  2: "grid-cols-1 md:grid-cols-2",
  3: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

const GAP_MAP = {
  sm: "gap-4",
  md: "gap-6",
  lg: "gap-8",
  xl: "gap-10",
};

export const GridLayout: React.FC<GridLayoutProps> = ({
  children,
  columns = 3,
  gap = "md",
  className,
  ...props
}) => {
  return (
    <div
      className={cn("grid w-full min-w-0 [&>*]:min-w-0", COLUMNS_MAP[columns], GAP_MAP[gap], className)}
      {...props}
    >
      {children}
    </div>
  );
};
