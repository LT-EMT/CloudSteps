import * as React from "react";
import { Pagination as AntPagination } from "antd";
import { cn } from "./utils";

function Pagination({ className, ...props }: React.ComponentProps<typeof AntPagination>) {
  return <AntPagination className={cn("", className)} {...props} />;
}

export { Pagination };
