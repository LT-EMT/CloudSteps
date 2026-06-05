import * as React from "react";
import { Input as AntInput } from "antd";

export interface InputProps extends Omit<React.ComponentProps<typeof AntInput>, 'size'> {
  size?: "default" | "sm" | "lg";
}

function Input({ size = "default", className, ...props }: InputProps) {
  const sizeMap: Record<string, React.ComponentProps<typeof AntInput>["size"]> = {
    default: "middle",
    sm: "small",
    lg: "large",
  };

  const antdSize = sizeMap[size] || "middle";

  return (
    <AntInput
      size={antdSize}
      className={className}
      {...props}
    />
  );
}

export { Input };
