#!/bin/sh
set -eu

escape_js() {
  printf '%s' "$1" | sed -e 's/\\/\\\\/g' -e 's/"/\\"/g' -e ':a;N;$!ba;s/\n/\\n/g'
}

APP_NAME="${APP_NAME:-LedgerFlow}"
APP_VERSION="${APP_VERSION:-1.0.0}"
APP_THEME="${APP_THEME:-dark}"
APP_PORT="${APP_PORT:-8080}"

cat > /usr/share/nginx/html/js/config.js <<EOF
window.APP_CONFIG = {
  APP_NAME: "$(escape_js "$APP_NAME")",
  APP_VERSION: "$(escape_js "$APP_VERSION")",
  APP_THEME: "$(escape_js "$APP_THEME")",
  APP_PORT: "$(escape_js "$APP_PORT")"
};
EOF

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec nginx -g 'daemon off;'
