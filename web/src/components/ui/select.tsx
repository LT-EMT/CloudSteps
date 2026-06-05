import * as React from "react";
import { Select as AntSelect } from "antd";
import { cn } from "@/utils/cn";

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onValueChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

const Select: React.FC<SelectProps> = ({
  value,
  onValueChange,
  options,
  placeholder = "请选择...",
  disabled = false,
  className = "",
}) => {
  return (
    <AntSelect
      value={value}
      onChange={onValueChange}
      options={options}
      placeholder={placeholder}
      disabled={disabled}
      className={cn("w-full", className)}
      style={{ width: "100%" }}
    />
  );
};

export { Select };
export default Select;
