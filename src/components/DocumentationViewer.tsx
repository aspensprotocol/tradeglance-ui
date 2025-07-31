import React from 'react';
import { cn } from '@/lib/utils';

interface DocumentationViewerProps {
  children: React.ReactNode;
  className?: string;
}

export const DocumentationViewer: React.FC<DocumentationViewerProps> = ({ 
  children, 
  className 
}) => {
  return (
    <div className={cn(
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
      "prose-ol:list-decimal prose-ol:pl-6 prose-ol:text-gray-600",
      "prose-li:mb-1",
      "prose-table:border-collapse prose-table:w-full",
      "prose-th:border prose-th:border-gray-300 prose-th:bg-gray-50 prose-th:px-4 prose-th:py-2 prose-th:text-left prose-th:font-semibold",
      "prose-td:border prose-td:border-gray-300 prose-td:px-4 prose-td:py-2",
      "prose-a:text-blue-600 prose-a:no-underline prose-a:hover:underline",
      "prose-hr:border-gray-300 prose-hr:my-8",
      className
    )}>
      {children}
    </div>
  );
};

// Custom markdown renderer for emojis and special formatting
export const renderMarkdown = (content: string) => {
  // Split content into lines for processing
  const lines = content.split('\n');
  const processedLines = lines.map((line, index) => {
    // Handle headers with emojis
    if (line.startsWith('# ')) {
      return <h1 key={index} className="text-4xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
        {line.replace('# ', '')}
      </h1>;
    }
    
    if (line.startsWith('## ')) {
      return <h2 key={index} className="text-3xl font-bold mt-12 mb-6 text-gray-800 border-b border-gray-200 pb-2">
        {line.replace('## ', '')}
      </h2>;
    }
    
    if (line.startsWith('### ')) {
      return <h3 key={index} className="text-2xl font-bold mt-8 mb-4 text-gray-700">
        {line.replace('### ', '')}
      </h3>;
    }
    
    // Handle code blocks
    if (line.startsWith('```')) {
      const codeBlock = [];
      let i = index + 1;
      while (i < lines.length && !lines[i].startsWith('```')) {
        codeBlock.push(lines[i]);
        i++;
      }
      return (
        <pre key={index} className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto my-4">
          <code>{codeBlock.join('\n')}</code>
        </pre>
      );
    }
    
    // Handle inline code
    if (line.includes('`')) {
      const parts = line.split('`');
      return (
        <p key={index} className="text-gray-600 leading-relaxed mb-4">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 0 ? 
              <span key={partIndex}>{part}</span> : 
              <code key={partIndex} className="text-sm bg-gray-100 px-2 py-1 rounded text-gray-800">{part}</code>
          )}
        </p>
      );
    }
    
    // Handle lists
    if (line.startsWith('- ')) {
      return (
        <li key={index} className="text-gray-600 mb-1 list-disc ml-6">
          {line.replace('- ', '')}
        </li>
      );
    }
    
    if (line.startsWith('1. ')) {
      return (
        <li key={index} className="text-gray-600 mb-1 list-decimal ml-6">
          {line.replace(/^\d+\.\s/, '')}
        </li>
      );
    }
    
    // Handle bold text
    if (line.includes('**')) {
      const parts = line.split('**');
      return (
        <p key={index} className="text-gray-600 leading-relaxed mb-4">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 0 ? 
              <span key={partIndex}>{part}</span> : 
              <strong key={partIndex} className="text-gray-900 font-semibold">{part}</strong>
          )}
        </p>
      );
    }
    
    // Handle italic text
    if (line.includes('*') && !line.startsWith('*')) {
      const parts = line.split('*');
      return (
        <p key={index} className="text-gray-600 leading-relaxed mb-4">
          {parts.map((part, partIndex) => 
            partIndex % 2 === 0 ? 
              <span key={partIndex}>{part}</span> : 
              <em key={partIndex} className="text-gray-700 italic">{part}</em>
          )}
        </p>
      );
    }
    
    // Handle links
    if (line.includes('[') && line.includes('](')) {
      const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
      const parts = line.split(linkRegex);
      return (
        <p key={index} className="text-gray-600 leading-relaxed mb-4">
          {parts.map((part, partIndex) => {
            if (partIndex % 3 === 1) {
              const url = parts[partIndex + 1];
              return (
                <a key={partIndex} href={url} className="text-blue-600 no-underline hover:underline">
                  {part}
                </a>
              );
            } else if (partIndex % 3 === 2) {
              return null; // Skip URL part
            } else {
              return <span key={partIndex}>{part}</span>;
            }
          })}
        </p>
      );
    }
    
    // Handle empty lines
    if (line.trim() === '') {
      return <br key={index} />;
    }
    
    // Regular paragraph
    return <p key={index} className="text-gray-600 leading-relaxed mb-4">{line}</p>;
  });
  
  return processedLines;
}; 