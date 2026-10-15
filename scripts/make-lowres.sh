#!/usr/bin/env bash
# scripts/make-lowres.sh — Generate 480p copies of video clips.
# Requires ffmpeg to be installed.
# Usage: ./scripts/make-lowres.sh
#
# Converts all .mp4 files in public/videos/ to 480p copies (filename_480.mp4).
# These copies are used when ?lowres=1 is set, for performance on slower hardware.

set -euo pipefail

VIDEOS_DIR="$(dirname "$0")/../public/videos"

if ! command -v ffmpeg &> /dev/null; then
  echo "❌ ffmpeg not found. Install it with: brew install ffmpeg"
  exit 1
fi

echo "🎬 Generating 480p copies of video clips..."
echo ""

count=0
for f in "$VIDEOS_DIR"/*.mp4; do
  [ -e "$f" ] || continue
  base="$(basename "$f" .mp4)"

  # Skip files that are already 480p copies
  if [[ "$base" == *_480 ]]; then
    continue
  fi

  output="$VIDEOS_DIR/${base}_480.mp4"

  if [ -f "$output" ]; then
    echo "  ⏭ ${base}_480.mp4 already exists, skipping"
    continue
  fi

  echo "  📹 Converting ${base}.mp4 → ${base}_480.mp4"
  ffmpeg -i "$f" \
    -vf "scale=-2:480" \
    -c:v libx264 -crf 23 -preset fast \
    -an \
    -movflags +faststart \
    "$output" \
    -y -loglevel warning

  count=$((count + 1))
done

echo ""
if [ $count -eq 0 ]; then
  echo "ℹ️  No new files to convert (0 clips found or all already converted)"
else
  echo "✅ Converted $count clip(s) to 480p"
fi
