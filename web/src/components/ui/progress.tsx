import * as React from "react";
import { Progress as AntProgress } from "antd";
import type { ProgressProps as AntProgressProps } from "antd";
import { cn } from "./utils";

function Progress({ className, ...props }: AntProgressProps) {
  return <AntProgress className={cn("", className)} {...props} />;
}

export { Progress };
