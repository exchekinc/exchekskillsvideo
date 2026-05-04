#!/usr/bin/env bash
# Batch-render all five demo videos with ElevenLabs narration.
#
# Usage:
#   ELEVENLABS_API_KEY=sk_... bash scripts/render-all-narrated.sh
#
# Each fixture is rendered once at standard quality, narrated. Audio
# files are cached at ~/.cache/exchek/vo-<input_hash>.mp3 so re-runs are
# free if the input hash hasn't changed.

set -euo pipefail
cd "$(dirname "$0")/.."

if [[ -z "${ELEVENLABS_API_KEY:-}" ]]; then
  echo "ERROR: ELEVENLABS_API_KEY env var must be set." >&2
  echo "  export ELEVENLABS_API_KEY=sk_..." >&2
  exit 2
fi

VOICE_ID="${EXCHEK_VOICE_ID:-EXAVITQu4vr4xnSDxMaL}"   # Sarah (default)
MODEL_ID="${EXCHEK_TTS_MODEL:-eleven_turbo_v2_5}"
CACHE_DIR="$HOME/.cache/exchek"
mkdir -p "$CACHE_DIR"; chmod 700 "$CACHE_DIR"

render_one() {
  local fixture="$1"; local template="$2"
  local base; base=$(basename "$fixture" .json)
  local hash; hash=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$fixture','utf8')).generated.input_hash)")
  local script; script=$(node scripts/report-to-video.mjs "$fixture" --template "$template" --audio-script-only)
  local audio="$CACHE_DIR/vo-$hash.mp3"

  if [[ ! -s "$audio" ]]; then
    echo "→ TTS [$template, hash=$hash]: $script"
    curl -sSf -X POST "https://api.elevenlabs.io/v1/text-to-speech/$VOICE_ID" \
      -H "xi-api-key: $ELEVENLABS_API_KEY" \
      -H "Content-Type: application/json" \
      -d "$(jq -n --arg t "$script" --arg m "$MODEL_ID" '{text:$t,model_id:$m,voice_settings:{stability:0.5,similarity_boost:0.75,style:0.1,use_speaker_boost:true}}')" \
      --output "$audio"
  else
    echo "→ TTS [$template]: cache hit ($audio)"
  fi

  node scripts/report-to-video.mjs "$fixture" \
    --template "$template" \
    --audio-file "$audio" \
    --quality standard \
    --output "renders/${template}-narrated.mp4"
}

render_one fixtures/risk-triage-sample.json            risk-triage
render_one fixtures/classification-sample.json         classification
render_one fixtures/red-flag-sample.json               red-flag
render_one fixtures/compliance-report-card-sample.json compliance-report-card
render_one fixtures/risk-triage-sample.json            training   # training reuses risk-triage data
# v1.1 templates
render_one fixtures/encryption-sample.json             encryption
render_one fixtures/deemed-export-sample.json          deemed-export
render_one fixtures/export-docs-sample.json            export-docs
render_one fixtures/ecp-sample.json                    ecp
render_one fixtures/audit-lookback-sample.json         audit-lookback
render_one fixtures/partner-compliance-sample.json     partner-compliance
render_one fixtures/recordkeeping-sample.json          recordkeeping

echo
echo "All renders complete:"
ls -lh renders/*-narrated.mp4
