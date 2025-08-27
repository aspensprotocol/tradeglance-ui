import { cn } from "@/lib/utils";

interface DocumentationViewerProps {
  children: React.ReactNode;
  className?: string;
}

export const DocumentationViewer = ({
  children,
  className,
}: DocumentationViewerProps): JSX.Element => {
  return (
    <article
      className={cn(
        "prose prose-xs sm:prose-sm lg:prose-base max-w-none prose-headings:text-neutral-900 prose-headings:font-bold",
        "prose-h1:text-xl sm:text-2xl lg:text-3xl prose-h1:mb-4 sm:mb-6 lg:mb-8 prose-h1:text-center prose-h1:bg-gradient-to-r prose-h1:from-blue-600 prose-h1:to-purple-600 prose-h1:bg-clip-text prose-h1:text-transparent",
        "prose-h2:text-lg sm:text-xl lg:text-2xl prose-h2:mt-8 sm:mt-10 lg:mt-12 prose-h2:mb-4 sm:mb-5 lg:mb-6 prose-h2:text-neutral-800 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2",
        "prose-h3:text-base sm:text-lg lg:text-xl prose-h3:mt-6 sm:mt-7 lg:mt-8 prose-h3:mb-3 sm:mb-4 prose-h3:text-neutral-700",
        "prose-p:text-neutral-700 prose-p:leading-relaxed prose-p:text-xs sm:text-sm",
        "prose-strong:text-neutral-900 prose-strong:font-semibold",
        "prose-em:text-neutral-800 prose-em:italic",
        "prose-code:text-xs sm:text-xs prose-code:bg-gray-100 prose-code:px-1 sm:px-2 prose-code:py-0.5 sm:py-1 prose-code:rounded prose-code:text-neutral-900",
        "prose-pre:bg-neutral-900 prose-pre:text-neutral-100 prose-pre:p-2 sm:p-3 lg:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto prose-pre:text-xs sm:text-xs",
        "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-2 sm:pl-3 lg:pl-4 prose-blockquote:italic prose-blockquote:text-neutral-800",
        "prose-ul:list-disc prose-ul:pl-4 sm:pl-5 lg:pl-6 prose-ul:text-neutral-700",
        "prose-li:mb-1",
        "prose-table:border-collapse prose-table:w-full prose-table:text-xs sm:text-xs",
        "prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-2 sm:px-3 lg:px-4 prose-th:py-1 sm:py-2 prose-th:text-left prose-th:font-semibold",
        "prose-td:border prose-td:border-gray-300 prose-td:px-2 sm:px-3 lg:px-4 prose-td:py-1 sm:py-2",
        "prose-a:text-blue-600 prose-a:no-underline prose-a:hover:underline prose-a:font-medium",
        "prose-hr:border-gray-300 prose-hr:my-6 sm:my-7 lg:my-8",
        className,
      )}
    >
      {children}
    </article>
  );
};
