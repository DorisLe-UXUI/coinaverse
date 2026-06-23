# v24 — Media integration (audio-bearing videos + BGM)

All 13 uploaded clips (720p, with real audio) wired into the live build.

## Page background videos (visual; muted by design so iOS autoplays w/o ► button)
- splash.mp4   ← Background_Loading
- signin.mp4   ← Background Sign up
- identity.mp4 ← background_choose_your_hero
- home.mp4     ← Backgound_home

## Hero lip-sync videos (play their OWN baked voice via .wvid exemption)
- strategist.mp4 · builder.mp4 · investor.mp4 · guardian.mp4 · risktaker.mp4 · rebuilder.mp4
  → welcome screen (line 407, #welcomeVid) now has sound. FIXES the silent lip-sync.

## Robot greet (CIRCUIT "Hey Hero!")
- greet.mp4 ← Robot_voice_Hey_Hero_welcome
- vbg() extended to accept {cls,id}; greet video now rendered as .scr-vid.wvid #greetVid
- applyAV('greet') stops any separate voice and plays greet.mp4's OWN baked audio
  (replaces old voice_welcome.mp3 ElevenLabs cue — kept on disk, just unused now)

## Audio
- bgm.mp3        ← Echo — Pulse  (global loop, vol 0.16, ducks to 0.05 under voice/video)
- voice_home.mp3 ← voice home    (spoken once on Home)

## Untouched on purpose
- 4 page bg videos stay MUTED: unmuting them would clash with BGM + need a gesture +
  risk a native play button. Architecture intent = backgrounds silent, voice carries via
  greet/hero lip-sync + bgm + voice cues. (Flag to Doris if you want them audible.)
