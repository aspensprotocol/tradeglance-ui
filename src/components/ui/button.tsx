import * as React from "react";
import { Slot } from "@radix-ui/react-slot";

import { cn } from "@/lib/utils";
import { buttonVariants, type ButtonProps } from "./button-variants";

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      color,
      asChild = false,
      materializeIcon,
      materializeIconPosition = "left",
      fullWidth,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // Handle Materialize variants
    if (variant?.startsWith("materialize")) {
      let materializeClasses = buttonVariants({
        variant,
        size,
        color,
        className,
      });

      // Add fullWidth class for Materialize
      if (fullWidth) {
        materializeClasses = cn(materializeClasses, "btn-block");
      }

      return (
        <Comp className={materializeClasses} ref={ref} {...props}>
          {materializeIcon && materializeIconPosition === "left" && (
            <i className="material-icons left">{materializeIcon}</i>
          )}
          {props.children}
          {materializeIcon && materializeIconPosition === "right" && (
            <i className="material-icons right">{materializeIcon}</i>
          )}
        </Comp>
      );
    }

    // Default behavior for existing variants
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button };
