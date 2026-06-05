import * as React from "react";
import { Checkbox as AntCheckbox } from "antd";
import { cn } from "./utils";

function Checkbox({
  className,
  ...props
}: React.ComponentProps<typeof AntCheckbox>) {
  return <AntCheckbox className={cn("", className)} {...props} />;
}

export { Checkbox };
