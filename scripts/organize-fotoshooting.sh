#!/bin/bash
# Copy all fotoshooting files to semantic names (originals preserved)
set -euo pipefail
python3 "$(dirname "$0")/generate-fotoshooting-index.py"
echo "Index: assets/fotoshooting-index.json"
echo "Named copies: Fotoshooting Schülerfirma/_named/"
