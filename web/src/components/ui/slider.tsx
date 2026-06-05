import * as React from "react";
import { Slider as AntSlider } from "antd";
import { cn } from "./utils";

function Slider({ className, ...props }: React.ComponentProps<typeof AntSlider>) {
  return <AntSlider className={cn("", className)} {...props} />;
}

export { Slider };
