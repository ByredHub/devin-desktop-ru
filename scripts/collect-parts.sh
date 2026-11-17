#!/usr/bin/env sh
# Забирает переведённые части из веток l10n/* в l10n/parts (без мержа истории веток)
set -e
git fetch -q origin '+refs/heads/l10n/*:refs/remotes/origin/l10n/*'
for b in $(git for-each-ref --format='%(refname:short)' refs/remotes/origin/l10n/); do
  for f in $(git ls-tree --name-only "$b" l10n/parts/ | grep '\.ru\.json$'); do git show "$b:$f" > "$f"; echo "$b → $f"; done
done
for f in l10n/parts/*.ru.json; do n=$(basename "$f" .ru.json); node scripts/validate.mjs "l10n/chunks/$n.en.json" "$f" | head -1 | sed "s/^/$n /"; done
