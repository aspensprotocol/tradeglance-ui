#!/bin/bash

# Documentation creation script for TradeGlance UI
# Usage: ./docs/create-doc.sh <filename> [title]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <filename> [title]"
    echo "Example: $0 api-reference 'API Reference'"
    exit 1
fi

FILENAME=$1
TITLE=${2:-"Aspens App Example Demo"}

# Create the new file from template in docs directory
cp docs/template.md "docs/${FILENAME}.md"

# Update the title in the new file (preserve the rest of the content)
sed -i '' "s/# .*Aspens App Example Demo/# ${TITLE}/" "docs/${FILENAME}.md"

# Also copy to public/docs for web access
cp "docs/${FILENAME}.md" "public/docs/${FILENAME}.md"

echo "✅ Created docs/${FILENAME}.md from template"
echo "✅ Copied to public/docs/${FILENAME}.md for web access"
echo "📝 Edit the file to customize the content for your specific use case"
echo "🌐 View at: http://localhost:5173/docs (after starting dev server)" 