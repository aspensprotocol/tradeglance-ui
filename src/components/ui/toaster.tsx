import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ErrorToast,
} from "@/components/ui/toast";

export function Toaster(): JSX.Element {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        // Use ErrorToast for destructive toasts with copy functionality
        if (variant === "destructive" && description) {
          const errorMessage = typeof description === "string" ? description : "An error occurred";
          return (
            <ErrorToast
              key={id}
              errorMessage={errorMessage}
              title={title || "Error"}
              {...props}
            />
          );
        }

        // Regular toast for non-destructive messages
        return (
          <Toast key={id} {...props}>
            <section className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </section>
            {action}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
