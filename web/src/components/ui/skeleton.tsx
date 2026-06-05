import * as React from "react";
import { Skeleton as AntSkeleton } from "antd";
import { cn } from "./utils";

function Skeleton({ className, ...props }: React.ComponentProps<typeof AntSkeleton>) {
  return <AntSkeleton className={cn("", className)} {...props} />;
}

export { Skeleton };
