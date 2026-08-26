# Casefile Zero

Casefile Zero is a cinematic detective game for Anna. It contains four complete fictional mysteries, original illustrated scenes and characters, a customizable detective identity, suspect interrogation, evidence discovery, clue linking, timeline reconstruction, accusation scoring, sound design, case ranks, and synced progress.

## How to play

1. Choose a detective portrait, codename, accent, and specialty.
2. Open a case dossier and read the briefing.
3. Inspect six marked scene locations.
4. Question at least two suspects. Prepared dialogue always works; custom questions use Anna's LLM when available and fall back safely when offline.
5. Link evidence on the board to establish deductions.
6. Reconstruct the timeline and submit a supported accusation.

The entire core game works without an Executa or third-party service. Anna Storage syncs the profile and active case. Standalone previews use local storage, and Anna LLM access is an optional enhancement for custom suspect dialogue.

## Local development

```powershell
cd C:\Users\parth\Desktop\my-first-anna-app\casefile-zero
npm test
anna-app validate --strict
anna-app dev --port 5187
```

Then open the harness URL printed by the CLI. The direct bundle can also be served as a standalone preview; only Anna-specific sync and LLM dialogue will be unavailable.

## Production checks

```powershell
npm run check
anna-app apps publish --account https://anna.partners --json
```

After upload, install and test the created version in Anna before submitting it for public review.

The release includes three real product-state screenshots (`bundle/listing/desk.png`, `board.png`, and `result.png`).
For a repeatable browser check, point `PLAYWRIGHT_MODULE` at a local Playwright package and run:

```powershell
node scripts/browser-smoke.mjs
node scripts/harness-smoke.mjs
```

These checks cover first use, the full clue → interview → evidence → accusation → result loop, active-game recovery after a reload, Anna-hosted runtime connection, and mobile horizontal-overflow protection.
