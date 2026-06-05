import * as React from "react";
import { Popover as AntPopover } from "antd";
import type { PopoverProps as AntPopoverProps } from "antd";
import { cn } from "./utils";

function Popover({ className, ...props }: AntPopoverProps) {
  return <AntPopover className={cn("", className)} {...props} />;
}

export { Popover };
