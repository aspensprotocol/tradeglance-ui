import * as React from "react";
import * as ToastPrimitives from "@radix-ui/react-toast";
import { type VariantProps, cva } from "class-variance-authority";
import { X, Copy, Check } from "lucide-react";

import { cn } from "@/lib/utils";

// Copy button component for all toast messages
const CopyButton = ({
  text,
  className,
}: {
  text: string;
  className?: string;
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy text:", err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-xl border border-neutral-300 bg-white/80 backdrop-blur-sm text-xs font-medium text-neutral-700 ring-offset-background transition-colors hover:bg-neutral-100/90 hover:border-neutral-400 hover:text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        className,
      )}
      title="Copy message"
    >
      {copied ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <Copy className="h-3 w-3" />
      )}
    </button>
  );
};

const ToastProvider = ToastPrimitives.Provider;

const ToastViewport = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Viewport
    ref={ref}
    className={cn(
      "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-2 sm:p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col max-w-[calc(100vw-2rem)] sm:max-w-[600px]",
      className,
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitives.Viewport.displayName;

const toastVariants = cva(
  "group pointer-events-auto relative flex w-full items-start justify-between space-x-2 sm:space-x-4 overflow-hidden rounded-xl border p-3 pr-6 sm:p-6 sm:pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
  {
    variants: {
      variant: {
        default:
          "border-neutral-300 bg-white/95 backdrop-blur-xl text-neutral-900 shadow-2xl",
        destructive:
          "destructive group border-red-300 bg-red-50/95 backdrop-blur-xl text-red-900 shadow-2xl",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const Toast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> &
    VariantProps<typeof toastVariants>
>(({ className, variant, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(toastVariants({ variant }), "max-w-full", className)}
      {...props}
    />
  );
});
Toast.displayName = ToastPrimitives.Root.displayName;

const ToastAction = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Action>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Action>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Action
    ref={ref}
    className={cn(
      "inline-flex h-8 shrink-0 items-center justify-center rounded-md border border-neutral-300 bg-white/80 backdrop-blur-sm px-3 text-xs font-medium text-neutral-900 ring-offset-background transition-colors hover:bg-neutral-100/90 hover:border-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-red-300 group-[.destructive]:bg-red-50/80 group-[.destructive]:text-red-900 group-[.destructive]:hover:bg-red-100/90 group-[.destructive]:hover:border-red-400 group-[.destructive]:focus:ring-red-400",
      className,
    )}
    {...props}
  />
));
ToastAction.displayName = ToastPrimitives.Action.displayName;

const ToastClose = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Close>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Close>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Close
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-neutral-600 opacity-0 transition-opacity hover:text-neutral-900 hover:bg-neutral-100/80 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 group-hover:opacity-100 group-[.destructive]:text-red-600 group-[.destructive]:hover:text-red-900 group-[.destructive]:hover:bg-red-100/80 group-[.destructive]:focus:ring-red-400",
      className,
    )}
    toast-close=""
    {...props}
  >
    <X className="h-4 w-4" />
  </ToastPrimitives.Close>
));
ToastClose.displayName = ToastPrimitives.Close.displayName;

const ToastTitle = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Title>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Title>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Title
    ref={ref}
    className={cn(
      "text-xs sm:text-sm font-semibold break-words whitespace-pre-wrap select-text cursor-text toast-title",
      className,
    )}
    {...props}
  />
));
ToastTitle.displayName = ToastPrimitives.Title.displayName;

const ToastDescription = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Description>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Description>
>(({ className, ...props }, ref) => (
  <ToastPrimitives.Description
    ref={ref}
    className={cn(
      "text-xs sm:text-sm opacity-90 break-words whitespace-pre-wrap select-text cursor-text toast-description",
      className,
    )}
    {...props}
  />
));
ToastDescription.displayName = ToastPrimitives.Description.displayName;

type ToastProps = React.ComponentPropsWithoutRef<typeof Toast>;

type ToastActionElement = React.ReactElement<typeof ToastAction>;

// Error toast component with copy functionality
const ErrorToast = React.forwardRef<
  React.ElementRef<typeof ToastPrimitives.Root>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitives.Root> & {
    errorMessage: string;
    title?: string;
    showCopy?: boolean;
  }
>(({ className, errorMessage, title = "Error", showCopy = true, ...props }, ref) => {
  return (
    <ToastPrimitives.Root
      ref={ref}
      className={cn(
        "group pointer-events-auto relative flex w-full items-start justify-between space-x-2 sm:space-x-4 overflow-hidden rounded-xl border border-red-300 bg-red-50/95 backdrop-blur-xl p-3 pr-6 sm:p-6 sm:pr-8 shadow-2xl transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[swipe=move]:transition-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=end]:animate-out data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
        className,
      )}
      {...props}
    >
      <section className="grid gap-2 flex-1 min-w-0">
        <ToastTitle className="text-red-900">{title}</ToastTitle>
        <ToastDescription className="max-w-full text-red-800">
          <span className="break-words whitespace-pre-wrap select-text cursor-text toast-description">
            {errorMessage}
          </span>
        </ToastDescription>
      </section>
      {showCopy && <CopyButton text={errorMessage} className="ml-2 shrink-0" />}
      <ToastClose />
    </ToastPrimitives.Root>
  );
});
ErrorToast.displayName = "ErrorToast";

export {
  type ToastProps,
  type ToastActionElement,
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastAction,
  ErrorToast,
  CopyButton,
};
