#!/bin/sh
# Runs on the KTH server, inside the target folder, after the build archive
# has been unpacked into .publish-staging/ (ADR-0003):
#
#   .publish-staging/files/<path>     the build
#   .publish-staging/swap/rename      paths to move into place, NUL-separated,
#                                     content-hashed assets first, then pages
#   .publish-staging/swap/remove      paths to remove, NUL-separated
#   .publish-staging/swap/record.json the new publish record
#
# It moves the build into place, then removes the listed files, then writes the
# record last, so an interruption before the first rename leaves the previous
# version and its record untouched. File names arrive only as NUL-separated
# data and are passed to commands as arguments, never built into a command.
#
# Usage: sh swap.sh <target-dir>
# Exit codes: 3 = a required tool is missing, 4 = staging incomplete,
#             5 = a target conflicts with the server's folder layout (all of
#             3-5 happen before anything moves),
#             other non-zero = a step failed (named on stderr).
set -eu

target=$1
cd -- "$target"

for tool in find tar mv xargs awk; do
  if ! command -v "$tool" >/dev/null 2>&1; then
    echo "remote-tools-missing: $tool" >&2
    exit 3
  fi
done

stage=.publish-staging
for part in "$stage/files" "$stage/swap/rename" "$stage/swap/remove" \
  "$stage/swap/record.json"; do
  if [ ! -e "$part" ]; then
    echo "staging-incomplete: $part" >&2
    exit 4
  fi
done

now() {
  date +%s.%N 2>/dev/null | grep -E '^[0-9]+\.[0-9]+$' || date +%s
}
start=$(now)

# 0. Check every target before anything moves: a target that is a folder, or
#    that has a symlink or a plain file as a parent, would make a rename write
#    into a folder, leave the site folder, or fail halfway (F-01).
xargs -0 sh -c '
  for p do
    if [ -d "$p" ]; then
      echo "layout-clash: $p" >&2
      exit 255
    fi
    d=$(dirname -- "$p")
    while [ "$d" != "." ] && [ "$d" != "/" ]; do
      if [ -L "$d" ] || { [ -e "$d" ] && [ ! -d "$d" ]; }; then
        echo "layout-clash: $p" >&2
        exit 255
      fi
      d=$(dirname -- "$d")
    done
  done
' sh <"$stage/swap/rename" || exit 5

# 1. Rename the build into place.
xargs -0 sh -c '
  for p do
    mkdir -p -- "$(dirname -- "$p")" &&
      mv -f -- ".publish-staging/files/$p" "$p" || {
      echo "rename-failed: $p" >&2
      exit 255
    }
  done
' sh <"$stage/swap/rename"

# 2. Remove owned or approved files the build no longer has, then any
#    directories those removals left empty.
xargs -0 sh -c '
  for p do
    if [ -e "$p" ] || [ -L "$p" ]; then
      rm -f -- "$p" || {
        echo "remove-failed: $p" >&2
        exit 255
      }
      d=$(dirname -- "$p")
      while [ "$d" != "." ] && rmdir -- "$d" 2>/dev/null; do
        d=$(dirname -- "$d")
      done
    fi
  done
' sh <"$stage/swap/remove"

# 3. Write the new record last: one rename on the same disk.
mv -f -- "$stage/swap/record.json" .publish-record.json

end=$(now)
rm -rf -- "$stage"
LC_ALL=C awk -v s="$start" -v e="$end" 'BEGIN { printf "swap-seconds=%.3f\n", e - s }'
