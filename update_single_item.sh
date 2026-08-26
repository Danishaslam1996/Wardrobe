#!/bin/bash
# A simple script to modify SingleItemIngestModal.tsx
# We will use sed to change `processedImage` to `processedImages`

sed -i 's/const \[processedImage, setProcessedImage\] = useState<string | null>(null);/const [processedImages, setProcessedImages] = useState<string[]>([]);\n  const [currentItemIndex, setCurrentItemIndex] = useState(0);/' src/components/SingleItemIngestModal.tsx

