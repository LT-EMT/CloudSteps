import * as React from "react";
import { Badge as AntBadge } from "antd";
import { cn } from "./utils";

function Badge({ className, ...props }: React.ComponentProps<typeof AntBadge>) {
  return <AntBadge className={cn("", className)} {...props} />;
}

export { Badge };
