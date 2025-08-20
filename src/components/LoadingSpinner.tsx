import { cn } from "@/lib/utils";

interface LoadingSpinnerProps {
  message?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = ({
  message = "Loading...",
  className = "",
  size = "md",
}: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-8 w-8",
    lg: "h-12 w-12",
  };

  return (
    <section
      className={cn("flex items-center justify-center py-12", className)}
    >
      <article className="text-center">
        <span
          className={cn(
            "animate-spin rounded-full border-b-2 border-blue-600 mx-auto mb-4",
            sizeClasses[size],
          )}
        ></span>
        <p className="text-gray-600">{message}</p>
      </article>
    </section>
  );
};
