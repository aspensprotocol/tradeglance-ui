#!/bin/bash

# Documentation creation script for TradeGlance UI
# Usage: ./docs/create-doc.sh <filename> [title]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <filename> [title]"
    echo "Example: $0 api-reference 'API Reference'"
    exit 1
fi

FILENAME=$1
TITLE=${2:-"Documentation"}

# Create the new file from template
cp docs/template.md "docs/${FILENAME}.md"

# Update the title in the new file
sed -i '' "s/# 📝 Documentation Template/# 📝 ${TITLE}/" "docs/${FILENAME}.md"

# Remove template-specific content
sed -i '' '/## 🎯 Purpose/,/Template created for TradeGlance UI documentation/d' "docs/${FILENAME}.md"

# Add a simple structure
cat > "docs/${FILENAME}.md" << EOF
# 📝 ${TITLE}

## 📋 Overview

[Add your overview here]

## 🏗️ Structure

[Add your structure here]

## 🔧 Implementation

[Add implementation details here]

## 📝 Examples

[Add examples here]

---

*Last updated: $(date +"%B %Y")*
EOF

echo "✅ Created docs/${FILENAME}.md"
echo "📝 Edit the file to add your content"
echo "🌐 View at: http://localhost:5173/docs (after starting dev server)" 