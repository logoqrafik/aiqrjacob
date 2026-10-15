#!/bin/sh
# Kullanım: ./ses-ekle.sh video.mp4 ses.m4a
v="$1"; a="$2"; out="${v%.mp4}-sesli.mp4"
ffmpeg -y -i "$v" -i "$a" -filter_complex "[1:a]loudnorm=I=-16:TP=-1.5:LRA=11,apad[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -shortest "$out" && echo "$out"
