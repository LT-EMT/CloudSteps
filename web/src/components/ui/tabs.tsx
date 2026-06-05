import * as React from "react";
import { Tabs as AntTabs } from "antd";
import type { TabsProps as AntTabsProps } from "antd";
import { cn } from "./utils";

function Tabs({ className, ...props }: AntTabsProps) {
  return <AntTabs className={cn("", className)} {...props} />;
}

export { Tabs };
