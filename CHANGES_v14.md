# Coinaverse v14.1 — May 22, 2026 · FULL APP

## Doris's feedback addressed
1. ✅ **Home uses ref image 1 as background** — 7 clickable hotspots positioned over the islands (Budgetron, Launch Lab, Bitstream, Savescape, Investopia, Debt Detox + **CredTech Galaxy** center)
2. ✅ **Walking path** under character — char walks to clicked hotspot before entering hub
3. ✅ **Splash/Greet/Welcome** — all have proper cosmic backgrounds now
4. ✅ **Identity** — restyled to 6 vertical rectangular cards in 1 row
5. ✅ **Party & Friends** — full screen built (4 party slots + 8 friends list + online/offline + invite/message)
6. ✅ **Leaderboards** — full screen built (top 3 podium + ranked list + Weekly/Monthly/All Time tabs)
7. ✅ **Reward Center** — full screen built (7-day streak calendar + 6 weekly challenges + claim button)
8. ✅ **7th hub: CredTech Galaxy** — full content screen (Cred Score progress + missions + 6 hub portals)

## All 13 screens fully working
| Screen | Status |
|---|---|
| splash (cosmic bg) | ✅ |
| signin | ✅ |
| greet (CIRCUIT robot) | ✅ |
| identity (6 cards × 1 row) | ✅ |
| welcome | ✅ |
| home (ref image 1 bg + 7 hotspots + walking char) | ✅ |
| party (full) | ✅ NEW |
| leaderboards (full) | ✅ NEW |
| reward_center (full) | ✅ NEW |
| credtech_hub (7th hub) | ✅ NEW |
| world_detail × 6 archetypes | ✅ |
| cinema (Netflix 12 ep) | ✅ |
| shop (12 merch) | ✅ |
| game (Coin Catcher) | ✅ |

## Home walking mechanic
- Click any of the 7 island hotspots → character walks to that island via CSS transition (1.2s)
- Then auto-routes to that hub's world_detail (or credtech_hub for center)
- "YOUR HUB" gold badge marks the player's archetype island

## 7 hubs
1. **BUDGETRON** (Strategist) · cyan
2. **LAUNCH LAB** (Builder) · amber
3. **BITSTREAM VALLEY** (Risk Taker) · red
4. **SAVESCAPE ORBIT** (Guardian) · ice blue
5. **INVESTOPIA** (Investor) · green
6. **DEBT DETOX** (Rebuilder) · violet
7. **CREDTECH GALAXY** (central meta-hub) · gold

## URL flags
- `?screen=home&arch=investor` — home as Investor
- `?screen=party` · `?screen=leaderboards` · `?screen=reward_center` · `?screen=credtech_hub`
- `?screen=world_detail&arch=rebuilder` — direct to a hub detail

## Test
```bash
unzip coinaverse_v14.zip
cd coinaverse_v14
python3 -m http.server 8000
# http://localhost:8000
```
