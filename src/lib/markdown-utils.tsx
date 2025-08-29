import React, { useState } from "react";
import { ImageModal } from "@/components/ImageModal";

export const MarkdownRenderer: React.FC<{ content: string }> = ({
  content,
}) => {
  const [modalImage, setModalImage] = useState<{
    src: string;
    alt: string;
  } | null>(null);

  const processMarkdown = (markdownContent: string): React.ReactElement[] => {
    // Split content into lines for processing
    const lines = markdownContent.split("\n");
    const processedLines: React.ReactElement[] = [];
    let skipUntil = -1;

    for (let index = 0; index < lines.length; index++) {
      const line = lines[index];

      // Skip lines that are part of a multi-item ordered list
      if (index <= skipUntil) {
        continue;
      }

      // Handle headers with emojis
      if (line.startsWith("# ")) {
        const headerText = line.replace("# ", "");

        // Split emoji and text to apply gradient only to text
        const emojiMatch = headerText.match(/^(\p{Emoji}+)/u);
        if (emojiMatch) {
          const emoji = emojiMatch[1];
          const text = headerText.replace(emoji, "").trim();
          const result = (
            <h1 key={index} className="text-3xl font-bold text-center mb-8">
              <span className="text-3xl">{emoji}</span>
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {text}
              </span>
            </h1>
          );
          processedLines.push(result);
          continue;
        } else {
          const result = (
            <h1 key={index} className="text-3xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {headerText}
              </span>
            </h1>
          );
          processedLines.push(result);
          continue;
        }
      }

      if (line.startsWith("## ")) {
        const headerText = line.replace("## ", "");
        const result = (
          <h2
            key={index}
            className="text-2xl font-bold mt-8 mb-4 text-neutral-800 border-b border-gray-200 pb-2"
          >
            {headerText}
          </h2>
        );
        processedLines.push(result);
        continue;
      }

      if (line.startsWith("### ")) {
        const headerText = line.replace("### ", "");
        const result = (
          <h3
            key={index}
            className="text-xl font-bold mt-6 mb-3 text-neutral-700"
          >
            {headerText}
          </h3>
        );
        processedLines.push(result);
        continue;
      }

      // Handle code blocks
      if (line.startsWith("```")) {
        const codeBlock: string[] = [];
        let i = index + 1;
        while (i < lines.length && !lines[i].startsWith("```")) {
          codeBlock.push(lines[i]);
          i++;
        }
        const result = (
          <pre
            key={index}
            className="bg-neutral-900 text-neutral-100 p-4 rounded-lg overflow-x-auto my-4"
          >
            <code className="text-xs">{codeBlock.join("\n")}</code>
          </pre>
        );
        processedLines.push(result);
        continue;
      }

      // Handle images and videos
      if (line.includes("![") && line.includes("](")) {
        const mediaMatch = line.match(/!\[([^\]]*)\]\(([^)]+)\)/);
        if (mediaMatch) {
          const [, altText, mediaUrl] = mediaMatch;
          const isVideo = mediaUrl.match(/\.(mp4|webm|ogg|mov)$/i);

          if (isVideo) {
            const result = (
              <figure key={index} className="my-6 text-center">
                <video
                  src={mediaUrl}
                  controls
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto"
                  onError={(
                    e: React.SyntheticEvent<HTMLVideoElement, Event>,
                  ) => {
                    console.error("Failed to load video:", mediaUrl);
                    e.currentTarget.style.display = "none";
                  }}
                >
                  Your browser does not support the video tag.
                </video>
              </figure>
            );
            processedLines.push(result);
            continue;
          } else {
            const result = (
              <figure key={index} className="my-6 text-center">
                <img
                  src={mediaUrl}
                  alt={altText}
                  className="max-w-full h-auto rounded-lg shadow-lg mx-auto cursor-pointer hover:shadow-xl transition-shadow duration-200"
                  onClick={() => setModalImage({ src: mediaUrl, alt: altText })}
                  onError={(
                    e: React.SyntheticEvent<HTMLImageElement, Event>,
                  ) => {
                    console.error("Failed to load image:", mediaUrl);
                    e.currentTarget.style.display = "none";
                  }}
                  title="Click to enlarge"
                />
              </figure>
            );
            processedLines.push(result);
            continue;
          }
        }
      }

      // Handle unordered lists
      if (line.startsWith("- ")) {
        const result = (
          <li key={index} className="text-neutral-700 mb-1 list-disc ml-6">
            {line.replace("- ", "")}
          </li>
        );
        processedLines.push(result);
        continue;
      }

      // Handle numbered lists (any number, not just starting with 1)
      if (/^\d+\.\s/.test(line)) {
        // Check if this is the start of an ordered list
        const listItems: string[] = [];
        let i = index;

        // Collect all consecutive numbered list items
        while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
          const listItemContent = lines[i].replace(/^\d+\.\s*/, "");
          listItems.push(listItemContent);
          i++;
        }

        // If we found multiple items, render them as a proper ordered list
        if (listItems.length > 1) {
          skipUntil = index + listItems.length - 1;
          const result = (
            <ol key={index} className="ml-8 mb-4 space-y-2 list-decimal">
              {listItems.map((listItemContent, itemIndex) => (
                <li
                  key={itemIndex}
                  className="text-gray-600 leading-relaxed mb-2"
                >
                  {listItemContent}
                </li>
              ))}
            </ol>
          );
          processedLines.push(result);
          continue;
        } else {
          // Single item
          const singleItemContent = line.replace(/^\d+\.\s*/, "");
          const result = (
            <ol key={index} className="ml-8 mb-4 list-decimal">
              <li className="text-gray-600 leading-relaxed mb-2">
                {singleItemContent}
              </li>
            </ol>
          );
          processedLines.push(result);
          continue;
        }
      }

      // Handle links - both external and internal
      if (line.includes("[") && line.includes("](") && line.includes(")")) {
        const linkMatch = line.match(/\[([^\]]+)\]\(([^)]+)\)/g);
        if (linkMatch) {
          // Process the line by splitting it into text and link parts
          const parts: (string | React.ReactElement)[] = [];
          let currentText = line;

          linkMatch.forEach((link: string, linkIndex: number) => {
            const [, text, url] = link.match(/\[([^\]]+)\]\(([^)]+)\)/) || [];
            if (text && url) {
              // Split the current text by this link
              const splitParts = currentText.split(link);

              // Add the text before the link
              if (splitParts[0]) {
                // Process bold text within this part
                if (splitParts[0].includes("**")) {
                  const boldParts = splitParts[0].split("**");
                  boldParts.forEach((boldPart: string, boldIndex: number) => {
                    if (boldIndex % 2 === 0) {
                      parts.push(
                        <span key={`text-${index}-${linkIndex}-${boldIndex}`}>
                          {boldPart}
                        </span>,
                      );
                    } else {
                      parts.push(
                        <strong
                          key={`bold-${index}-${linkIndex}-${boldIndex}`}
                          className="text-gray-900 font-semibold"
                        >
                          {boldPart}
                        </strong>,
                      );
                    }
                  });
                } else {
                  parts.push(splitParts[0]);
                }
              }

              // Add the link element
              const isExternal = url.startsWith("http");
              const linkElement = isExternal ? (
                <a
                  key={`${url}-${index}-${linkIndex}`}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline font-medium"
                >
                  {text}
                </a>
              ) : (
                <a
                  key={`${url}-${index}-${linkIndex}`}
                  href={url}
                  className="text-blue-600 hover:underline font-medium"
                >
                  {text}
                </a>
              );
              parts.push(linkElement);

              // Update current text to the remaining part
              currentText = splitParts[1] || "";
            }
          });

          // Add any remaining text
          if (currentText) {
            // Process bold text within the remaining part
            if (currentText.includes("**")) {
              const boldParts = currentText.split("**");
              boldParts.forEach((boldPart: string, boldIndex: number) => {
                if (boldIndex % 2 === 0) {
                  parts.push(
                    <span key={`remaining-text-${index}-${boldIndex}`}>
                      {boldPart}
                    </span>,
                  );
                } else {
                  parts.push(
                    <strong
                      key={`remaining-bold-${index}-${boldIndex}`}
                      className="text-gray-900 font-semibold"
                    >
                      {boldPart}
                    </strong>,
                  );
                }
              });
            } else {
              parts.push(currentText);
            }
          }

          const result = (
            <p key={index} className="text-neutral-700 leading-relaxed mb-4">
              {parts}
            </p>
          );
          processedLines.push(result);
          continue;
        }
      }

      // Handle bold text
      if (line.includes("**")) {
        const parts: string[] = line.split("**");
        const result = (
          <p key={index} className="text-neutral-700 leading-relaxed mb-4">
            {parts.map((part: string, partIndex: number) =>
              partIndex % 2 === 0 ? (
                <span key={partIndex}>{part}</span>
              ) : (
                <strong
                  key={partIndex}
                  className="text-neutral-900 font-semibold"
                >
                  {part}
                </strong>
              ),
            )}
          </p>
        );
        processedLines.push(result);
        continue;
      }

      // Handle italic text
      if (line.includes("*") && !line.startsWith("*")) {
        const parts: string[] = line.split("*");
        const result = (
          <p key={index} className="text-neutral-700 leading-relaxed mb-4">
            {parts.map((part: string, partIndex: number) =>
              partIndex % 2 === 0 ? (
                <span key={partIndex}>{part}</span>
              ) : (
                <em key={partIndex} className="text-neutral-800 italic">
                  {part}
                </em>
              ),
            )}
          </p>
        );
        processedLines.push(result);
        continue;
      }

      // Handle empty lines
      if (line.trim() === "") {
        const result = <br key={index} />;
        processedLines.push(result);
        continue;
      }

      // Regular paragraph
      const result = (
        <p key={index} className="text-neutral-700 leading-relaxed mb-4">
          {line}
        </p>
      );
      processedLines.push(result);
    }

    return processedLines;
  };

  return (
    <>
      {processMarkdown(content)}
      <ImageModal
        src={modalImage?.src || ""}
        alt={modalImage?.alt || ""}
        isOpen={!!modalImage}
        onClose={() => setModalImage(null)}
      />
    </>
  );
};
