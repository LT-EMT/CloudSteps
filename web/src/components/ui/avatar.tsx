import * as React from "react";
import { Avatar as AntAvatar } from "antd";
import { cn } from "./utils";

function hashStringToHue(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function getInitials(name?: string) {
  const n = (name ?? "").trim();
  if (!n) return "";

  const parts = n.split(/\s+/).filter(Boolean);
  const joined = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : parts[0];
  const compact = joined.replace(/\s+/g, "");
  return compact.slice(0, 2).toUpperCase();
}

function Avatar({ className, ...props }: React.ComponentProps<typeof AntAvatar>) {
  return <AntAvatar className={cn("", className)} {...props} />;
}

type SmartAvatarProps = {
  name?: string;
  src?: string;
  alt?: string;
  className?: string;
  imageClassName?: string;
  fallbackClassName?: string;
};

function SmartAvatar({
  name,
  src,
  alt,
  className,
  imageClassName,
  fallbackClassName,
}: SmartAvatarProps) {
  const initials = getInitials(name);
  const hue = hashStringToHue(name ?? "user");
  const background = `hsl(${hue} 70% 45%)`;

  return (
    <AntAvatar
      src={src}
      alt={alt ?? name}
      className={className}
      style={!src ? { backgroundColor: background } : undefined}
    >
      {!src && <span className={cn("text-white font-semibold", fallbackClassName)}>{initials}</span>}
    </AntAvatar>
  );
}

export { Avatar, SmartAvatar };
