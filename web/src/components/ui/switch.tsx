import * as React from "react";
import { Switch as AntSwitch } from "antd";
import { cn } from "./utils";

function Switch({
  className,
  ...props
}: React.ComponentProps<typeof AntSwitch>) {
  return <AntSwitch className={cn("", className)} {...props} />;
}

export { Switch };
