import { cva, type VariantProps } from "class-variance-authority";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-xs font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        // Materialize variants
        materialize: "btn waves-effect waves-light",
        materializeFlat: "btn-flat waves-effect waves-light",
        materializeRaised: "btn-large waves-effect waves-light",
        materializeFloating: "btn-floating waves-effect waves-light",
        materializeSmall: "btn-small waves-effect waves-light",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-xl px-3",
        lg: "h-11 rounded-xl px-8",
        icon: "h-10 w-10 rounded-xl",
        // Materialize sizes
        materializeSmall: "btn-small",
        materializeLarge: "btn-large",
        materializeBlock: "btn-block",
      },
      color: {
        // Materialize colors
        materializeBlue: "blue",
        materializeTeal: "teal",
        materializeGreen: "green",
        materializeOrange: "orange",
        materializeRed: "red",
        materializeCyan: "cyan",
        materializeGrey: "grey lighten-4",
        materializeDark: "grey darken-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    // Materialize specific props
    materializeIcon?: string;
    materializeIconPosition?: "left" | "right";
    fullWidth?: boolean;
  };
