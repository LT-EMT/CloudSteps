import * as React from "react";
import { Breadcrumb as AntBreadcrumb } from "antd";
import { cn } from "./utils";

function Breadcrumb({ className, ...props }: React.ComponentProps<typeof AntBreadcrumb>) {
  return <AntBreadcrumb className={cn("", className)} {...props} />;
}

export { Breadcrumb };
