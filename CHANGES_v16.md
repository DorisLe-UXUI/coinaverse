# Coinaverse v15 → v16 — May 30, 2026
## Built to Kabria's Coinaverse Experience-Flow doc (May 29 2026)

### v15 (carried in)
- Archetype signature colors LOCKED to doc: Strategist=Blue, Builder=Purple⚑,
  Investor=Green, Guardian=Teal, RiskTaker=Red, Rebuilder=Amber⚑.
- NEW Avatar Studio: colorway palette locked to player's archetype color.
- Fixed latent bug: `--c-credtech` was never defined → added (#38BDF8 cyan).

### v16 — NEW: 7 full hub-landing dashboards (doc-faithful)
Each hub = the reference-image layout:
- INFO panel (title · THE X'S UNIVERSE · description · 5 verb icons · tagline · ENTER button)
- HUB MAP (radial node map: glowing core + 8 district nodes over the hub cityscape;
  CredTech uses the real credtech_central.jpeg art)
- HUB GAMES (8 district cards 01–08, from doc)
- DAILY MISSIONS · WEEKLY QUESTS (3 named quests each) · HUB BENEFITS · STATUS RANKS (6 tiers)
- Bottom action bar: PLAY GAMES · LEARN · EARN COINS & XP · LEVEL UP · UNLOCK REWARDS · BECOME A MASTER X
All content lifted from the doc (Investopia, Budgetron, SaveScape, Launch, Bitstream, Debt Detox).
Themed per archetype color automatically (`var(--c-token)`).

### Flow change
- Home island click / PLAY NOW / walk → now lands on `hub` (doc dashboard).
- Hub "ENTER" → existing MOBA `world_detail` (deeper zone) → `game`.
- So: Home → Hub Landing → Zone → Game.

### CredTech = pending content
Doc PDF truncated CredTech (title page only). Hub renders with real map + a flagged
"send full flow" note. Districts/missions/quests/ranks blank until you send the flow.

### Still needs YOU to generate (see chat asset list)
- 6 hub MAP arts (radial floating-island style, matching credtech_central) — biggest visual win.
- 6 archetype hero portraits in new 3D Pixar style (transparent PNG).
- Optional: 56 district tile thumbnails (CSS-art placeholder for now).
- Decisions: Builder Yellow vs Purple · Rebuilder color · CredTech archetype.
