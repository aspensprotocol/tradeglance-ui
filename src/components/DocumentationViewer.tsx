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
        "prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:font-bold",
        "prose-h1:text-4xl prose-h1:mb-8 prose-h1:text-center prose-h1:bg-gradient-to-r prose-h1:from-blue-600 prose-h1:to-purple-600 prose-h1:bg-clip-text prose-h1:text-transparent",
        "prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6 prose-h2:text-gray-800 prose-h2:border-b prose-h2:border-gray-200 prose-h2:pb-2",
        "prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4 prose-h3:text-gray-700",
        "prose-p:text-gray-600 prose-p:leading-relaxed",
        "prose-strong:text-gray-900 prose-strong:font-semibold",
        "prose-em:text-gray-700 prose-em:italic",
        "prose-code:text-sm prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:text-gray-800",
        "prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-pre:p-4 prose-pre:rounded-lg prose-pre:overflow-x-auto",
        "prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-700",
        "prose-ul:list-disc prose-ul:pl-6 prose-ul:text-gray-600",
        "prose-li:mb-1",
        "prose-table:border-collapse prose-table:w-full",
        "prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
        "prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2",
        "prose-a:text-blue-600 prose-a:no-underline prose-a:hover:underline prose-a:font-medium",
        "prose-hr:border-gray-300 prose-hr:my-8",
        className,
      )}
    >
      {children}
    </article>
  );
};
