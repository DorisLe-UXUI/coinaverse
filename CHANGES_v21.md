# Coinaverse v21 — May 30, 2026

## Video backgrounds (audio KEPT — videos talk; bgm auto-ducks while they play)
- splash      ← Background_Loading
- signin      ← Background Sign up
- identity    ← background_choose_your_hero
- home        ← Backgound_home   (poster = islands map, video animates over it)
- welcome     ← per-archetype video (THE STRATEGIST/BUILDER/INVESTOR/GUARDIAN/RISK TAKER/REBUILDER)
                · first ~1.6s baked-text intro CUT off
                · kept v20 HTML text, removed HTML character cutout (video shows the hero)
- greet       ← Robot_voice video (first ~2.2s baked text CUT); robot PNG removed,
                v20 "Hey Hero! I'm CIRCUIT" text kept; robot speaks via voice_welcome

## Audio
- bgm        = Echo — Pulse (loop, ~0.16, ducks to ~0.05 on video screens / during voices)
- voice_home    plays once on entering Home
- voice_game    plays on entering Game — processed to a light ROBOT tone (ring-mod + phaser + echo)
- voice_welcome plays on Greet (robot intro speech)
- audio unlocks on first tap (browser rule); 🔊 toggle bottom-left to mute/unmute

## Home fixes
- PLAY NOW no longer covers the character (hero raised above the CTA cluster)
- star_3d: baked gray checkerboard removed → clean transparent gold star (3 usages) + CSS gold glow

## Files
- assets/video/*.mp4 (11) · assets/audio/*.mp3 (4) · assets/ui/star_3d.png · style-v21.css

# v22 patch (May 30, 2026)
- Splash holds ~10s (full loading video) before signin; loading bar tracks 9.5s
- Native video PLAY button hidden (webkit media controls) + forced muted-autoplay → no play icon
- Greet: text moved to RIGHT (robot stays on left, bright/undimmed)
- Veils rebuilt per-screen: darken ONLY the text side, character videos stay bright + text stays readable

# v23 — FULL ASSET INTEGRATION (May 30, 2026)
VOICE (82 ElevenLabs clips wired):
- greet→sys_greet · home→sys_home_enter · game→robotized voice_game
- enter any hub → <hub>_hub_welcome plays (bgm ducks)
- open any district → <hub>_dNN_lesson plays (host teaches)
IMAGES mapped by keyword into slots:
- 45 game-board arts → assets/game/<hub>_dNN.jpg (district tiles; fallback to island tile)
- 56 lesson keyframes → assets/learn/<hub>_dNN.jpg (district Learn panel)
- 40 rank badges → assets/ui/rank_<hub>_tN.png (Status Ranks list)
- 23 mission icons → assets/ui/mis_<hub>_N.png (Daily Missions)
- 7 reward crates → assets/ui/crate_<hub>.png (Reward Center, floating)
NEW UI:
- District cards are clickable → District overlay: Learn keyframe + concept + mini-game art + PLAY GAME + host voice
- Status Ranks show badge icons; Daily Missions show icons; Reward Center shows a floating crate
- Missing slots degrade gracefully (onerror hides / gradient fallback)

# v24 — P1·P2·P3·P4 (the working demo)
P1 PERSISTENCE+PROGRESSION: localStorage save/load per user; XP→level (100xp/lvl) w/ level-up toast+confetti; learn a district = +25XP (once); tick daily mission = +20💰+15XP (once); hub rank highlights by districts learned.
P2 GAMES: universal framework + 3 real mechanics (Tap-Collect, Needs/Wants Sort, Timing-Meter) routed to ALL districts via game-board art backdrop; rewards coins+XP, marks game done.
P3 REAL SCREENS (no more alerts): Profile, Settings (sound/reset/logout), Inventory (+currency token), Skill tree, Inbox, Party invite, dynamic Leaderboard (Global/Archetype/Friends).
P4 AUTH FACADE: email signup/login + Google/Apple + guest, accounts in localStorage, per-account progress. (Real OAuth needs backend — Phase 5.)
DISTRICT OVERLAY: full 16:9 host video on top (no crop), plays WITH its teaching audio on click (mute btn), bgm ducks, no double voiceover.
CINEMA: real video player overlay (openVideo) replaces alert.

# v25 — real SHOP + per-hub GAMES + cinema Drive
SHOP (Coincept store, real): 11 real Kabria products (3 flash-card sets, activity books, planners) w/ real USD prices + descriptions + age ranges, Coincept green/gold covers (CSS). Full CART (localStorage, qty +/-) + DRAWER + CHECKOUT (shipping+payment facade, tax/shipping, order confirmation #). Coming-soon items show ribbon + Notify-me.
GAMES per-hub (lesson-tied): credit=Credit Builder (on-time payment meter); strategist=Budget Boss (Need/Want); investor=Smart Investor (catch rising/avoid crash); builder=Startup Builder (catch parts/avoid bugs); guardian=Save or Spend; risktaker=Risk or Safe; rebuilder=Debt Crusher (good/bad debt). Score pops, end screen, coins+XP rewards, hub-color glow.
CINEMA: Drive-embed support (openVideoDrive + cvSetEpisodes) — ready for real episode file IDs.

# v25b — welcome sound · full-board games · real cinema
WELCOME: plays archetype voice (the 6 welcome videos lost their audio in the mute-fix & originals are gone — voice layered so screen talks; re-upload originals-with-audio to use the video's own track).
MINI-GAMES: game-board art now shown FULL (opacity .92) with top/bottom scrims for readable HUD + controls; cleaner composition.
CINEMA: rebuilt with 9 REAL Kabria/Coincept lessons (titles from "Video Ver 3" Drive + descriptions from JQ scripts): Wants vs Needs, What is Financial Literacy, How Kids Can Earn Money, Setting a Money Goal, Different Places to Keep Your Money, Dollars & Cents Power Lessons, Madam x Pluto, Madam x Bahati, Dr x Zuna. Netflix-style hero+rows. Drive-embed playback ready — call cvWireEpisodes([10 file IDs]) or paste links and I plug them; Drive thumbnails auto-load once linked.

# v25c — real product photos + cinema folder embed
SHOP: all 11 real Coincept product photos extracted from sheet screenshots → assets/shop/<id>.jpg, wired as store covers + cart thumbnails (real e-commerce look).
CINEMA: clicking any lesson now opens Kabria's public Drive folder embedded in-app (real videos play immediately) — pending optional 10 individual file IDs for per-card direct play + auto thumbnails.

# v25d — real videos embedded + scroll/bg/detail fixes
CINEMA: 9 real Kabria lesson videos compressed to 720p (keep audio) → assets/video/cinema/ep0-8.mp4 + real poster frames (ep*.jpg). Plays locally in-app (no Drive, no 403). Removed folder-embed fallback.
WELCOME: 6 archetype character videos (hero_speaks, WITH their own voice) → assets/video/<arch>_welcome.mp4; welcome screen plays them unmuted; removed ElevenLabs voice cue.
AUDIO RULE: window.stopVoice() — any talking video (welcome / district host / lesson) kills the ElevenLabs lab voice (no double audio).
SCROLL: removed position:relative override that broke scroll on store & cinema (now scroll normally).
BG COVER: .has-vid{position:relative;min-height:100vh} so background video covers full screen (no black bar).
STORE: product cards clickable → product DETAIL modal (big real photo + full Coincept description + age + price + Add to Cart).

# v25e — mobile-friendly compression
Images resized to display sizes + recompressed (ui 107→16M, game 45→11M, learn 39→7M, tiles 45→15M, +map/char/movies/bg) — saved ~209MB.
Cinema ep3/ep4 re-encoded 720p CRF31 (42+28M → 4.5+7M). Build ~637MB → ~360MB.

# v25f — mobile autoplay + welcome character fix
IMG1: background .scr-vid/.home-bg-video now ALWAYS muted (was unmuted after first tap → iOS blocked autoplay → ► button). Now muted-autoplay works on iOS, no play button.
IMG2: welcome screen reverted to CORRECT archetype kid character video (assets/video/{archetype}.mp4) — the _welcome.mp4 I'd wired were actually Mr JQ (host), not the 6 kid characters. Kid clips are silent cinematic (8s); no ElevenLabs voice on welcome.

# v25g — welcome lip-sync audio-ready
Welcome video = .scr-vid.wvid (exempt from force-mute) playing assets/video/{archetype}.mp4 with its OWN audio (lip-sync). NOTE: the app's 6 kid videos had audio stripped in the earlier autoplay fix; Doris to re-upload the 6 originals (with lip-sync voice) → drop into assets/video/{archetype}.mp4 → plays with sound automatically.
