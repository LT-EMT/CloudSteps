import * as React from "react";
import { Tooltip as AntTooltip } from "antd";
import type { TooltipProps as AntTooltipProps } from "antd";
import { cn } from "./utils";

function Tooltip({ className, ...props }: AntTooltipProps) {
  return <AntTooltip className={cn("", className)} {...props} />;
}

export { Tooltip };
