import * as React from "react";
import { Divider as AntDivider } from "antd";
import { cn } from "./utils";

function Separator({ className, ...props }: React.ComponentProps<typeof AntDivider>) {
  return <AntDivider className={cn("", className)} {...props} />;
}

export { Separator };
