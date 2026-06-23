# Coinaverse v14 → v15 — May 30, 2026
## Built to Kabria's Coinaverse Experience-Flow doc (May 29 2026)

### 1. Archetype signature colors — LOCKED to doc (style.css)
| Archetype | v14 | v15 (doc lock) |
|---|---|---|
| Strategist | cyan | **Blue #3B82F6** |
| Builder | amber | **Purple #A855F7** ⚑ p1 said Yellow — 1-line swap |
| Investor | emerald | **Green #10B981** ✓ |
| Guardian | ice blue | **Teal #14B8A6** |
| Risk Taker | red | **Red #EF4444** ✓ |
| Rebuilder | violet | **Amber #F59E0B** ⚑ doc gave no color — provisional |
Single source of truth: all screens read `var(--c-<token>)`, so home hotspots,
identity cards, world_detail, etc. re-themed automatically.

### 2. NEW screen — Avatar Studio (the doc's #1 ask)
- Was a stub: home CUSTOMIZE button = `alert('Customize avatar')`. Now → `goTo('avatar')`.
- Colorway palette is **locked to the player's archetype signature color** — 8 shades
  of that one color (doc: "choose investor → lots of green to choose from").
- Hero preview on pedestal with archetype-tinted glow + Aura FX (Pulse / Orbit Ring / Sparks / None).
- Identity card (icon, zone, power, signature-color chip) + SAVE LOOK + CHANGE ARCHETYPE.
- SAVE applies chosen shade to `--player-c` (home character glow follows it).
- Uses existing `assets/bgs/bg_avatar_studio.jpeg`.

### Not done yet (needs your call — see chat)
- 3D Pixar character pack (download.zip): NOT swapped in. Filenames are generic
  (time mage / warrior / light mage / adventurer) — need archetype→character mapping first.
- CredTech archetype + Rebuilder color: doc didn't assign — using provisional cyan / amber.
- Full 7-hub landing pages (8 districts each) per doc: that's the next build.
