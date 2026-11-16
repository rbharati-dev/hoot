while read -r tag u; do
  [ -z "$u" ] && continue
  c=$(curl -sL -o /tmp/f -w "%{http_code}" -m 20 -A "Mozilla/5.0 (compatible; HootNewsBot/1.0; +https://hootdaily.com)" "$u"); [ -f /tmp/f ] || : > /tmp/f
  n=$(grep -o "<item\|<entry" /tmp/f | wc -l); img=$(grep -o "media:content\|media:thumbnail\|<enclosure\|<img " /tmp/f | wc -l)
  t=$(grep -o "<title>[^<]*" /tmp/f | head -1 | cut -c8-60)
  echo "$tag $c items=$n img=$img $u | $t"; rm -f /tmp/f
done < probe-feeds.txt
