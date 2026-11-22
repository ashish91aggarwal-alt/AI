#!/usr/bin/env bash
# Downloads the original meme clips the Mulank 8 reel uses (not stored in git: they belong to their owners).
# Sources and how to find more: ../viral-hooks/HOOKS.md. Run from this folder.
set -e; mkdir -p audio/memes; cd audio/memes
get(){ [ -s "$1" ] || curl -sL --max-time 30 -o "$1" "$2"; echo "$1 $(ffprobe -v error -show_entries format=duration -of csv=p=0 "$1")s"; }
get ruko-zara-sabar-karo-bhau.mp3       https://content-storage.voicemod.net/7412005effaccbd51db6b1cf51bf955494549212faa3648fa71b3ed4a09c33ff
get bachcha-hai-tu-mera-rakesh-bedi.mp3 https://content-storage.voicemod.net/2576d9d56a7dc3381563148175ffa6e286396e89d5690719636a48b31dec6071
get ab-tu-gaya-beta-puneet.mp3          https://www.myinstants.com/media/sounds/ab-tu-gaya-beta-ab-dekh-tu-puneet.mp3
get aayein-meme.mp3                     https://www.myinstants.com/media/sounds/aayein-meme.mp3
get faaah.mp3                           https://www.myinstants.com/media/sounds/faaah.mp3
get vine-boom.mp3                       https://www.myinstants.com/media/sounds/vine-boom.mp3
get moye-moye.mp3                       https://www.myinstants.com/media/sounds/moye-moye.mp3
get anime-wow-sound-effect.mp3          https://www.myinstants.com/media/sounds/anime-wow-sound-effect.mp3
get oh-no-no-no-no-laugh.mp3            https://www.myinstants.com/media/sounds/oh-no-no-no-no-laugh.mp3
