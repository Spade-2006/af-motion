import React from "react";
import { cn } from "@/utils/cn";
import { Badge } from "@/components/ui/Badge";

export interface SectionHeadingProps {
  readonly tag?: string;
  readonly title: string;
  readonly description?: string;
  readonly align?: "left" | "center" | "right";
  readonly className?: string;
}

export const SectionHeading: React.FC<SectionHeadingProps> = ({
  tag,
  title,
  description,
  align = "center",
  className,
}) => {
  const alignmentClass =
    align === "center"
      ? "text-center mx-auto items-center"
      : align === "right"
      ? "text-right ml-auto items-end"
      : "text-left items-start";

  return (
    <div className={cn("flex flex-col max-w-3xl mb-12 sm:mb-16", alignmentClass, className)}>
      {tag && (
        <Badge variant="glow" size="sm" className="mb-4">
          {tag}
        </Badge>
      )}
      <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed font-normal">
          {description}
        </p>
      )}
    </div>
  );
};
