# Casefile Zero Deployment

The current Anna guide is: https://forum.anna.partners/t/build-on-anna-101/228

This app is UI-only. It has no bundled Executa, so multi-platform binary packaging and Agent installation are not required.

```powershell
$ANNA_HOST = "https://anna.partners"
cd C:\Users\parth\Desktop\my-first-anna-app\casefile-zero

npm test
anna-app validate --strict
anna-app dev --port 5187

# Optional browser acceptance (set PLAYWRIGHT_MODULE to a local Playwright package)
node scripts/browser-smoke.mjs
node scripts/harness-smoke.mjs

# After browser acceptance:
anna-app apps publish --account $ANNA_HOST --json
```

`apps publish` uploads the UI and creates the immutable app version. It does not make the app publicly discoverable. Install and test the uploaded version in Anna, submit it for review in the Developer Console, and release only after that version passes review.

## Windows CLI note

The current CLI (`anna-app` 0.1.49) crashed during publish under system Node 24 with a libuv `UV_HANDLE_CLOSING` assertion. The same command succeeded under the installed Node 22 runtime required by the Anna guide:

```powershell
fnm exec --using=v22.23.2 -- C:\Users\parth\AppData\Roaming\npm\anna-app.cmd apps publish --account https://anna.partners --json
```

Release `1.0.1` includes three English product screenshots under `bundle/listing/`, explicit saveable Agent session permission modes (`auto` and `fixed`), bounded hydrated game state, serialized Anna Storage writes, and browser regression coverage for the complete investigation loop plus reload recovery. Run `anna-app apps sync-meta --account $ANNA_HOST --json` after publishing if the listing does not immediately show the screenshot URLs.

Verified Anna candidate: version `1.0.1`, version id `586`, content hash `9f8cfe6fb277aab05e1176e50eba229ba6d11da0973e765226e992255b496e0e`, bundle `bundle_ready` (15 files). `apps submit-review` pins `review_candidate_version=1.0.1`; owner install reports `installed_version=1.0.1`, `latest_version=1.0.1`, `update_available=false`, and satisfied grants. Listing sync returned three Anna CDN screenshot URLs. Lifecycle remains `pending_review` / `is_published=false` until Anna approves it.

Do not use the Developer Console version-history **Publish** action or `apps release` while the app is awaiting review; those are public-release operations. `apps publish` creates the immutable candidate, then install that exact version, verify grants, and submit the candidate for review.
