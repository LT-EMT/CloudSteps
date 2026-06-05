import * as React from "react";
import { Card as AntCard } from "antd";

export interface CardProps extends React.ComponentProps<typeof AntCard> {}

function Card({ className, ...props }: CardProps) {
  return <AntCard className={className} {...props} />;
}

function CardHeader({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardTitle({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <h4 className={className}>{children}</h4>;
}

function CardDescription({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <p className={className}>{children}</p>;
}

function CardAction({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardContent({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

function CardFooter({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
};
