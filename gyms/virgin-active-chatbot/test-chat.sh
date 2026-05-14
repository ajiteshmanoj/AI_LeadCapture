#!/usr/bin/env bash
# Usage: ./test-chat.sh "your question here"
MESSAGE="${1:-How much is JC2 with two subjects?}"
ORG_ID="00000000-0000-0000-0000-000000000002"

curl -s -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d "$(printf '{"org_id":"%s","channel":"web","message":"%s"}' "$ORG_ID" "$MESSAGE")" \
  | python3 -m json.tool
