import * as React from "react";
import { Table as AntTable } from "antd";
import type { TableProps as AntTableProps } from "antd";
import { cn } from "./utils";

function Table<T = any>({ className, ...props }: AntTableProps<T>) {
  return <AntTable className={cn("", className)} {...props} />;
}

export { Table };
