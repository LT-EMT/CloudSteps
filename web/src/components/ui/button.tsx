import * as React from "react";
import { Button as AntButton } from "antd";
import { cn } from "./utils";

export interface ButtonProps extends Omit<React.ComponentProps<typeof AntButton>, 'variant' | 'size'> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  asChild?: boolean;
}

const variantStyles: Record<string, string> = {
  default: "bg-[#4ECDC4] text-white hover:bg-[#45b8b0]",
  destructive: "bg-[#FF6B6B] text-white hover:bg-[#ff5252]",
  outline: "border border-slate-200 bg-white text-slate-900 hover:bg-slate-50",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  ghost: "text-slate-900 hover:bg-slate-100",
  link: "text-[#4ECDC4] hover:underline",
};

const sizeStyles: Record<string, string> = {
  default: "h-10 px-4 py-2",
  sm: "h-9 px-3",
  lg: "h-11 px-8",
  icon: "h-10 w-10",
};

export function buttonVariants({
  variant = "default",
  size = "default",
  className,
}: {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
} = {}) {
  return cn(
    "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 hover:shadow-md active:scale-[0.99] disabled:pointer-events-none disabled:opacity-50",
    variantStyles[variant],
    sizeStyles[size],
    className,
  );
}

function Button({ 
  variant = "default", 
  size = "default", 
  asChild = false,
  className,
  ...props 
}: ButtonProps) {
  const variantMap: Record<string, React.ComponentProps<typeof AntButton>["type"]> = {
    default: "primary",
    destructive: "primary",
    outline: "default",
    secondary: "default",
    ghost: "text",
    link: "link",
  };

  const sizeMap: Record<string, React.ComponentProps<typeof AntButton>["size"]> = {
    default: "middle",
    sm: "small",
    lg: "large",
    icon: "small",
  };

  const antdType = variantMap[variant] || "default";
  const antdSize = sizeMap[size] || "middle";

  const danger = variant === "destructive";

  return (
    <AntButton
      type={antdType}
      size={antdSize}
      danger={danger}
      className={buttonVariants({ variant, size, className })}
      {...props}
    />
  );
}

export { Button };
