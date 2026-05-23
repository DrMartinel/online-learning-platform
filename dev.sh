#!/usr/bin/env bash
set -euo pipefail

HOST_UID="${HOST_UID:-$(id -u)}"
HOST_GID="${HOST_GID:-$(id -g)}"

export HOST_UID HOST_GID

exec docker compose -f docker-compose.dev.yml up --build "$@"

