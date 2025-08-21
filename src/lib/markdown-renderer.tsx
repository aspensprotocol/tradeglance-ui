import React from "react";
import { MarkdownRenderer } from "./markdown-utils";

// Custom markdown renderer for emojis and special formatting
export const renderMarkdown = (content: string): React.ReactElement => {
  return <MarkdownRenderer content={content} />;
};
