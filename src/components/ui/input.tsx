import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  variant?: "default" | "materialize";
  inputSize?: "default" | "sm" | "lg"; // Renamed from 'size'
  error?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type,
      variant = "default",
      inputSize = "default",
      error = false,
      leftIcon,
      rightIcon,
      ...props
    },
    ref,
  ) => {
    // Materialize variant
    if (variant === "materialize") {
      return (
        <section className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {leftIcon}
            </span>
          )}
          <input
            type={type}
            className={cn(
              "block w-full rounded-xl border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error && "border-red-500 focus:border-red-500 focus:ring-red-500",
              inputSize === "sm" && "p-2 text-sm",
              inputSize === "lg" && "p-3 text-base",
              className,
            )}
            ref={ref}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
              {rightIcon}
            </span>
          )}
        </section>
      );
    }

    // Default shadcn variant
    return (
      <section className="relative">
        {leftIcon && (
          <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
            {leftIcon}
          </span>
        )}
        <input
          type={type}
          className={cn(
            "block w-full rounded-xl border border-neutral-300 bg-neutral-50 p-2.5 text-sm text-neutral-900 focus:border-blue-500 focus:ring-blue-500",
            leftIcon && "pl-10",
            rightIcon && "pr-10",
            error && "border-destructive focus-visible:ring-destructive",
            inputSize === "sm" && "p-2 text-xs",
            inputSize === "lg" && "p-3 text-sm",
            className,
          )}
          ref={ref}
          {...props}
        />
        {rightIcon && (
          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-500">
            {rightIcon}
          </span>
        )}
      </section>
    );
  },
);
Input.displayName = "Input";

export { Input };
