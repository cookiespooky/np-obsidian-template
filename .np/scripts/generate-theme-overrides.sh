#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
NOTE_FILE="${1:-$ROOT/theme.md}"
OUT_FILE="${2:-$ROOT/.np/theme/assets/theme-overrides.css}"

mkdir -p "$(dirname "$OUT_FILE")"

trim() {
  local v="$1"
  v="${v#"${v%%[![:space:]]*}"}"
  v="${v%"${v##*[![:space:]]}"}"
  printf '%s' "$v"
}

strip_wrapping_quotes() {
  local v="$1"
  if [[ "$v" =~ ^\".*\"$ ]]; then
    printf '%s' "${v:1:${#v}-2}"
    return
  fi
  if [[ "$v" =~ ^\'.*\'$ ]]; then
    printf '%s' "${v:1:${#v}-2}"
    return
  fi
  printf '%s' "$v"
}

is_valid_hex_color() {
  local v="$1"
  [[ "$v" =~ ^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$ ]]
}

is_valid_font_family() {
  local v="$1"
  [[ -n "$v" ]] || return 1
  [[ ${#v} -le 160 ]] || return 1
  [[ ! "$v" =~ [\;\{\}] ]] || return 1
  printf '%s' "$v" | LC_ALL=C grep -Eq "^[A-Za-z0-9, '\"-]+$"
}

is_allowed_color_key() {
  case "$1" in
    color_bg|color_surface|color_surface_soft|color_surface_alt|color_surface_deep|color_border|color_text|color_muted|color_link|color_accent|color_success|color_warning|color_danger|color_info)
      return 0
      ;;
    *)
      return 1
      ;;
  esac
}

ROOT_LINES=""
DARK_LINES=""
FONT_FAMILY=""

if [[ -f "$NOTE_FILE" ]]; then
  in_frontmatter="false"
  frontmatter_done="false"
  while IFS= read -r raw_line || [[ -n "$raw_line" ]]; do
    line="$(trim "$raw_line")"
    if [[ "$frontmatter_done" == "false" ]]; then
      if [[ "$line" == "---" ]]; then
        if [[ "$in_frontmatter" == "false" ]]; then
          in_frontmatter="true"
        else
          frontmatter_done="true"
        fi
      fi
      if [[ "$in_frontmatter" == "false" || "$frontmatter_done" == "true" ]]; then
        continue
      fi
    else
      continue
    fi

    [[ -n "$line" ]] || continue
    [[ "$line" == \#* ]] && continue
    [[ "$line" == *:* ]] || continue

    key="$(trim "${line%%:*}")"
    value_raw="$(trim "${line#*:}")"
    value="$(strip_wrapping_quotes "$value_raw")"
    [[ -n "$key" && -n "$value" ]] || continue

    if [[ "$key" == "font_family" ]]; then
      if is_valid_font_family "$value"; then
        FONT_FAMILY="$value"
      else
        echo "theme-overrides: invalid font_family ignored: $value" >&2
      fi
      continue
    fi

    if [[ "$key" =~ ^(light|dark)_(color_[a-z0-9_]+)$ ]]; then
      mode="${BASH_REMATCH[1]}"
      suffix="${BASH_REMATCH[2]}"
      if ! is_allowed_color_key "$suffix"; then
        echo "theme-overrides: unsupported key ignored: $key" >&2
        continue
      fi
      if ! is_valid_hex_color "$value"; then
        echo "theme-overrides: invalid color ignored for $key: $value" >&2
        continue
      fi
      css_var="--${suffix//_/-}: $value;"
      if [[ "$mode" == "light" ]]; then
        ROOT_LINES="${ROOT_LINES}  ${css_var}"$'\n'
      else
        DARK_LINES="${DARK_LINES}  ${css_var}"$'\n'
      fi
    fi
  done < "$NOTE_FILE"
fi

{
  echo "/* Auto-generated. Edit theme.md in repository root. */"
  echo "/* Invalid values are skipped; defaults from styles.css remain active. */"
  echo

  if [[ -n "$FONT_FAMILY" || -n "$ROOT_LINES" ]]; then
    echo ":root {"
    if [[ -n "$FONT_FAMILY" ]]; then
      echo "  --font-family-base: $FONT_FAMILY;"
    fi
    printf '%s' "$ROOT_LINES"
    echo "}"
    echo
  fi

  if [[ -n "$DARK_LINES" ]]; then
    echo ".theme-dark {"
    printf '%s' "$DARK_LINES"
    echo "}"
    echo
  fi
} > "$OUT_FILE"
