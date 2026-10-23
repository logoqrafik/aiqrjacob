#!/bin/sh
# Kullanım: ./ses-ekle.sh video.mp4 ses.m4a
# Videodaki müzik/efektler konuşma sırasında otomatik kısılır (ducking).
v="$1"; a="$2"; out="${v%.mp4}-sesli.mp4"
ffmpeg -y -i "$v" -i "$a" -filter_complex \
"[1:a]loudnorm=I=-16:TP=-1.5:LRA=9,asplit=2[vo][sc];[0:a]volume=0.9[bg0];[bg0][sc]sidechaincompress=threshold=0.03:ratio=9:attack=15:release=350[bg];[bg][vo]amix=inputs=2:duration=first:normalize=0,alimiter=limit=0.95[a]" \
 -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k "$out" && echo "$out"
