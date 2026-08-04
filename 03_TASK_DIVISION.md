# Signal Wire — Task Division

Live board: https://rudrasachapara21.atlassian.net/jira/software/projects/KAN/boards/2

## 🔵 Research (Epic KAN-6) — Owner: Krish
| Ticket | Task |
|---|---|
| KAN-12 | Research top ad platforms for small/local businesses (Meta, Google, Instagram, etc.) |
| KAN-13 | Research competitor tools in ad-strategy-advisor space |
| KAN-14 | Compile free-tier API research doc (Gemini, Tavily, Meta, Google Ads) |
| KAN-15 | Research influencer/creator category patterns per niche |

## 🟢 Frontend (Epic KAN-7) — Owner: Haimik
| Ticket | Task |
|---|---|
| KAN-16 | Design and build intake form (brand name, description, budget) |
| KAN-17 | Build loading/processing state screen |
| KAN-18 | Build full report display screen (all sections) |
| KAN-19 | Make UI responsive (mobile + desktop) |
| KAN-20 | Apply Signal Wire visual theme (colors, fonts) |

## 🟠 Backend (Epic KAN-8) — Owner: Rudra
| Ticket | Task |
|---|---|
| KAN-21 | Set up Gemini API integration |
| KAN-22 | Set up Tavily search API integration |
| KAN-23 | Design report JSON schema (platform, competitors, budget split, etc.) |
| KAN-24 | Build budget-split calculation logic |
| KAN-25 | Integrate Meta/Google Ads benchmark data |

## 🟣 Testing (Epic KAN-9) — Owner: Krish
| Ticket | Task |
|---|---|
| KAN-26 | Test intake form validation (empty fields, edge cases) |
| KAN-27 | Test AI output consistency across multiple runs |
| KAN-28 | Test budget-split math accuracy |
| KAN-29 | Cross-browser/device testing |

## 🟡 Documentation (Epic KAN-10) — Owner: Krish
| Ticket | Task |
|---|---|
| KAN-30 | Write/update README.md |
| KAN-31 | Write final project report |
| KAN-32 | Write presentation/demo script |
| KAN-33 | Document API setup steps for teammates |

## 🔴 Deployment (Epic KAN-11) — Owner: Rudra
| Ticket | Task |
|---|---|
| KAN-34 | Set up hosting (Vercel/Netlify for frontend) |
| KAN-35 | Set up backend deployment/env variables |
| KAN-36 | Final integration testing before demo |
| KAN-37 | Prepare fallback/cached demo (in case live API fails during viva) |

## Suggested order of attack
1. **KAN-21** (Gemini API integration) — everything else in Backend depends on this
2. **KAN-16** (intake form) can start in parallel — doesn't depend on backend being done
3. **KAN-23** (JSON schema) should be finalized early and shared with Haimik, since the frontend report screen needs to know the shape of the data it's displaying
4. Research (KAN-12–15) can run fully in parallel with everything else
5. Testing and Documentation naturally come after the above are functional
