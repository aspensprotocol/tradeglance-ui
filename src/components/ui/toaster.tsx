import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
  ErrorToast,
  CopyButton,
} from "@/components/ui/toast";

export function Toaster(): JSX.Element {
  const { toasts } = useToast();

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        // Use ErrorToast for destructive toasts with copy functionality
        if (variant === "destructive" && description) {
          const errorMessage =
            typeof description === "string" ? description : "An error occurred";
          return (
            <ErrorToast
              key={id}
              errorMessage={errorMessage}
              title={title || "Error"}
              {...props}
            />
          );
        }

        // Regular toast for non-destructive messages with copy functionality
        const messageText = typeof description === "string" ? description : "";
        return (
          <Toast key={id} {...props}>
            <section className="grid gap-1 flex-1 min-w-0">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription className="max-w-full">
                  <span className="break-words whitespace-pre-wrap select-text cursor-text toast-description">
                    {description}
                  </span>
                </ToastDescription>
              )}
            </section>
            {action}
            {messageText && (
              <CopyButton text={messageText} className="ml-2 shrink-0" />
            )}
            <ToastClose />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}
