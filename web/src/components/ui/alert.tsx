import * as React from "react";
import { Alert as AntAlert } from "antd";

export interface AlertProps extends Omit<React.ComponentProps<typeof AntAlert>, 'variant'> {
  variant?: "default" | "destructive";
}

function Alert({ variant = "default", className, ...props }: AlertProps) {
  const antdType = variant === "destructive" ? "error" : "info";
  
  return (
    <AntAlert
      type={antdType}
      className={className}
      {...props}
    />
  );
}

function AlertTitle({ children }: { children: React.ReactNode }) {
  return <strong>{children}</strong>;
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <span>{children}</span>;
}

export { Alert, AlertTitle, AlertDescription };
