# v25 — Trim baked text off the 7 speaking videos + full review pass

## Text fix (the reported bug)
All 7 character/robot clips had a UI text card baked into the opening (~first 0.4s,
fading out). Trimmed 0.5s off the START of each, re-encoded H.264/AAC (kept 720p,
audio stays in sync). New first frame is text-free on all 7; clips now ~9.5s, loop clean.
- greet · strategist · builder · investor · guardian · risktaker · rebuilder
- Voice safe: greet/builder speech starts ~1.4–1.5s; others' first 0.5s was intro
  ambient only — no spoken words clipped.

## Full review pass (headless walk of all 19 screens)
- JS errors: NONE
- Real missing assets / broken paths: NONE
  (5 large bg/hero mp4s flagged by the crawler were false positives — aborted range
   requests from fast screen-switching; all confirmed present on disk.)

## Notes (harmless, left in place)
- voice_welcome.mp3 now unused (greet uses the robot video's baked voice) — kept on disk.
- {archetype}_welcome.mp4 older audio copies remain unused — kept; not referenced, no 404.
- 4 page-bg videos (splash/signin/identity/home) still muted by design.
