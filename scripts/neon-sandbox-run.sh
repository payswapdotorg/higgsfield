#!/usr/bin/env bash
# scripts/neon-sandbox-run.sh — HF-W6 sandbox-only Prisma/Neon reachability shim.
#
# WHY THIS EXISTS (a sandbox defect, NOT a repo/product defect):
#   1. The Prisma query engine resolves DNS with its own Rust resolver
#      (hickory-resolver 0.24.4 is compiled into libquery_engine), NOT glibc
#      getaddrinfo. For the Neon endpoints that path lands on AAAA/IPv6, and
#      this sandbox has NO IPv6 egress ("Network is unreachable") — so every
#      engine connection dies with P1001 "Can't reach database server", even
#      though plain TCP+TLS to the very same endpoints over IPv4 works (and
#      glibc-based clients like node's pg resolve IPv4-first and connect fine).
#   2. The engine's resolver consults /etc/hosts BEFORE DNS, and an
#      unprivileged user namespace (`unshare -rm`, permitted here) lets us
#      bind-mount a hosts shim over /etc/hosts without real root.
#
# So this script: resolves the Neon hostnames to IPv4 with the SYSTEM
# resolver, writes a hosts shim, and runs the given command inside
# `unshare -rm` with the shim bind-mounted over /etc/hosts. All child
# processes (dev servers, test runners, dfork'd daemons) inherit the mount
# namespace, so a whole verify.mjs battery can run against Neon.
#
# Vercel/production deployments need NONE of this — it is purely this
# sandbox's IPv6-less engine path. Same doctrine as scripts/dfork_launch.py
# (Task 70): sandbox tooling banked in-tree so the station can reproduce
# verification. Documented in docs/DEPLOYMENT.md §"Sandbox-only notes".
#
# Usage:
#   DATABASE_URL='postgresql://…' scripts/neon-sandbox-run.sh [--host NAME]… -- <command> [args…]
#
# Hostnames: any --host NAME args are shimmed verbatim; otherwise the host
# parsed out of DATABASE_URL is shimmed, plus its "-pooler" twin (Neon's
# pooled endpoint hostname = <endpoint-id>-pooler.<proxy-host>).

set -euo pipefail

HOSTS_SHIM="$(mktemp /tmp/hf-w6-neon-hosts.XXXXXX)"
cleanup() { rm -f "$HOSTS_SHIM"; }
trap cleanup EXIT

declare -a SHIM_HOSTS=()
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) SHIM_HOSTS+=("$2"); shift 2 ;;
    --) shift; break ;;
    *) echo "neon-sandbox-run.sh: unexpected argument: $1 (use -- <command>)" >&2; exit 2 ;;
  esac
done
if [[ $# -eq 0 ]]; then
  echo "neon-sandbox-run.sh: no command after --" >&2
  exit 2
fi

if [[ ${#SHIM_HOSTS[@]} -eq 0 ]]; then
  DB_HOST="$(python3 -c 'import os,sys; from urllib.parse import urlparse; h=urlparse(os.environ.get("DATABASE_URL","")).hostname; sys.stdout.write(h or "")')"
  if [[ -z "$DB_HOST" ]]; then
    echo "neon-sandbox-run.sh: DATABASE_URL not set and no --host given" >&2
    exit 2
  fi
  SHIM_HOSTS+=("$DB_HOST")
  # Neon pooled twin: ep-xxx.<proxy> → ep-xxx-pooler.<proxy>
  if [[ "$DB_HOST" == ep-* && "$DB_HOST" != *-pooler.* ]]; then
    endpoint="${DB_HOST%%.*}"
    rest="${DB_HOST#*.}"
    SHIM_HOSTS+=("${endpoint}-pooler.${rest}")
  fi
fi

{
  echo "127.0.0.1 localhost"
  echo "::1 localhost"
} > "$HOSTS_SHIM"
for h in "${SHIM_HOSTS[@]}"; do
  ip="$(getent ahostsv4 "$h" | awk '{print $1; exit}')"
  if [[ -z "$ip" ]]; then
    echo "neon-sandbox-run.sh: cannot resolve an IPv4 for $h" >&2
    exit 1
  fi
  echo "$ip $h" >> "$HOSTS_SHIM"
done

exec unshare -rm bash -c 'mount --bind "$1" /etc/hosts && exec "${@:2}"' bash "$HOSTS_SHIM" "$@"
