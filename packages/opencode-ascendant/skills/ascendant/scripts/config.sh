#!/usr/bin/env bash
set -euo pipefail

# Method preference for the skill. Per working directory, like person records
# and installed dependencies, so it never dirties the host repository.
WORKING_DIRECTORY="$(pwd -P)"
CONFIG_DIR="${WORKING_DIRECTORY}/.ascendant"
CONFIG_FILE="${CONFIG_DIR}/config.txt"

print_error() {
  printf 'error: %s\ncode: %s\nhelp: %s\n' "$1" "$2" "$3"
}

lowercase() {
  printf '%s' "$1" | tr '[:upper:]' '[:lower:]'
}

normalize_method() {
  case "$(lowercase "$1")" in
    kp | krishnamurti | krishnamurti-vp291) printf 'KP' ;;
    parashari | parashara | vedic | lahiri) printf 'Parashari' ;;
    null | none | "") printf 'NULL' ;;
    *) return 1 ;;
  esac
}

normalize_boolean() {
  case "$(lowercase "$1")" in
    true | yes | 1) printf 'TRUE' ;;
    false | no | 0) printf 'FALSE' ;;
    *) return 1 ;;
  esac
}

read_key() {
  [ -f "${CONFIG_FILE}" ] || return 0
  sed -n "s/^$1:[[:space:]]*//p" "${CONFIG_FILE}" | tail -n 1
}

show() {
  local status raw_method raw_ask method ask
  if [ -f "${CONFIG_FILE}" ]; then
    status="found"
    raw_method="$(read_key defaultMethod)"
    raw_ask="$(read_key askMethodEverySession)"
  else
    status="missing"
    raw_method=""
    raw_ask=""
  fi

  # A missing or hand-edited value falls back to "ask every time" rather than
  # to a hardcoded school.
  method="$(normalize_method "${raw_method}")" || method="NULL"
  ask="$(normalize_boolean "${raw_ask}")" || ask="TRUE"
  if [ "${method}" = "NULL" ]; then
    ask="TRUE"
  fi

  printf 'config:\n  status: %s\n  path: %s\n  defaultMethod: %s\n  askMethodEverySession: %s\n' \
    "${status}" "${CONFIG_FILE}" "${method}" "${ask}"
}

write_config() {
  local raw_method="" raw_ask="" method ask
  local method_given="false"
  local ask_given="false"

  while [ "$#" -gt 0 ]; do
    case "$1" in
      --default-method)
        if [ "$#" -lt 2 ]; then
          print_error "Missing value for $1" "INVALID_ARGUMENT" "Pass --default-method KP|Parashari|NULL"
          exit 1
        fi
        raw_method="$2"
        method_given="true"
        shift 2
        ;;
      --ask-method-every-session)
        if [ "$#" -lt 2 ]; then
          print_error "Missing value for $1" "INVALID_ARGUMENT" "Pass --ask-method-every-session TRUE|FALSE"
          exit 1
        fi
        raw_ask="$2"
        ask_given="true"
        shift 2
        ;;
      *)
        print_error "Unknown option: $1" "INVALID_ARGUMENT" "Use --default-method and --ask-method-every-session"
        exit 1
        ;;
    esac
  done

  if [ "${method_given}" = "false" ] || [ "${ask_given}" = "false" ]; then
    print_error \
      "Both preferences are required" \
      "INVALID_ARGUMENT" \
      "Pass --default-method KP|Parashari|NULL and --ask-method-every-session TRUE|FALSE"
    exit 1
  fi

  if ! method="$(normalize_method "${raw_method}")"; then
    print_error \
      "defaultMethod must be KP, Parashari, or NULL (received: ${raw_method})" \
      "INVALID_ARGUMENT" \
      "Pass --default-method KP|Parashari|NULL"
    exit 1
  fi

  if ! ask="$(normalize_boolean "${raw_ask}")"; then
    print_error \
      "askMethodEverySession must be TRUE or FALSE (received: ${raw_ask})" \
      "INVALID_ARGUMENT" \
      "Pass --ask-method-every-session TRUE|FALSE"
    exit 1
  fi

  # No default school means the method must be asked every session.
  if [ "${method}" = "NULL" ]; then
    ask="TRUE"
  fi

  mkdir -p "${CONFIG_DIR}"
  if [ ! -e "${CONFIG_DIR}/.gitignore" ]; then
    printf '*\n' > "${CONFIG_DIR}/.gitignore"
  fi
  printf 'defaultMethod: %s\naskMethodEverySession: %s\n' "${method}" "${ask}" > "${CONFIG_FILE}"

  printf 'config:\n  status: written\n  path: %s\n  defaultMethod: %s\n  askMethodEverySession: %s\n' \
    "${CONFIG_FILE}" "${method}" "${ask}"
}

action="${1:-show}"
if [ "$#" -gt 0 ]; then
  shift
fi

case "${action}" in
  show) show ;;
  set) write_config "$@" ;;
  *)
    print_error "Unknown command: ${action}" "INVALID_ARGUMENT" "Use show or set"
    exit 1
    ;;
esac
