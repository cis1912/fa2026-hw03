#!/usr/bin/env bash
#
# Tests a deployed HW3 backend with nothing but curl.
#
#   ./scripts/smoke-test.sh http://my-alb-1234.us-east-1.elb.amazonaws.com
#   ./scripts/smoke-test.sh https://abc123.execute-api.us-east-1.amazonaws.com
#
# Works against either part -- both deployments answer the same two endpoints.
# Every check prints the exact curl command it runs, so you can copy any single
# step out of here and poke at it by hand. You do not need to edit this file.

set -u

BASE_URL="${1:-}"
if [ -z "$BASE_URL" ]; then
  echo "usage: $0 <base-url>" >&2
  echo "  e.g. $0 \"\$(terraform output -raw base_url)\"" >&2
  exit 2
fi
BASE_URL="${BASE_URL%/}"

failures=0

pass() { printf '  \033[32mPASS\033[0m %s\n\n' "$1"; }
fail() {
  printf '  \033[31mFAIL\033[0m %s\n\n' "$1"
  failures=$((failures + 1))
}

# Runs curl, setting $body and $code. Prints the command first.
request() {
  # Echo a copy-pasteable version of the command, with arguments quoted.
  printf '  $ curl -sS'
  for arg in "$@"; do printf ' %q' "$arg"; done
  printf '\n'
  local out
  out="$(curl -sS -m 30 -w $'\n%{http_code}' "$@" 2>&1)" || {
    body="$out"
    code="000"
    return 0
  }
  code="${out##*$'\n'}"
  body="${out%$'\n'*}"
  printf '  -> %s %s\n' "$code" "$body"
}

# Pulls a string field out of a JSON body without needing jq installed.
json_field() {
  printf '%s' "$2" | sed -n "s/.*\"$1\": *\"\([^\"]*\)\".*/\1/p" | head -1
}

echo
echo "Testing $BASE_URL"
echo

echo "[1/3] GET /health should return 200"
request "$BASE_URL/health"
if [ "$code" = "200" ] && printf '%s' "$body" | grep -q '"ok"'; then
  pass "the app is up and answering"
else
  fail "expected 200 with {\"status\":\"ok\"}, got $code"
fi

echo "[2/3] GET / should return the current time"
request "$BASE_URL/"
first_time=""
if [ "$code" = "200" ] && printf '%s' "$body" | grep -q '"time"'; then
  first_time="$(json_field time "$body")"
  pass "time=$first_time runtime=$(json_field runtime "$body") platform=$(json_field platform "$body")"
else
  fail "expected 200 with a \"time\" field, got $code"
fi

echo "[3/3] GET / again should return a *different* time"
request "$BASE_URL/"
second_time="$(json_field time "$body")"
if [ "$code" = "200" ] && [ -n "$second_time" ] && [ "$second_time" != "$first_time" ]; then
  # Proves the clock is being read per request, rather than a value baked in at
  # build time or served from a cache somewhere between you and the app.
  pass "time advanced to $second_time"
elif [ "$code" = "200" ] && [ -n "$second_time" ]; then
  fail "got the same timestamp twice ($second_time) -- is something caching?"
else
  fail "expected 200 with a \"time\" field, got $code"
fi

if [ "$failures" -eq 0 ]; then
  printf '\033[32mAll checks passed.\033[0m\n'
  exit 0
fi
printf '\033[31m%s check(s) failed.\033[0m\n' "$failures"
exit 1
