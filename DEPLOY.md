# Casefile Zero Deployment

The current Anna guide is: https://forum.anna.partners/t/build-on-anna-101/228

This app is UI-only. It has no bundled Executa, so multi-platform binary packaging and Agent installation are not required.

```powershell
$ANNA_HOST = "https://anna.partners"
cd C:\Users\parth\Desktop\my-first-anna-app\casefile-zero

npm test
anna-app validate --strict
anna-app dev --port 5187

# After browser acceptance:
anna-app apps publish --account $ANNA_HOST --json
```

`apps publish` uploads the UI and creates the immutable app version. It does not make the app publicly discoverable. Install and test the uploaded version in Anna, submit it for review in the Developer Console, and release only after that version passes review.

## Windows CLI note

The current CLI (`anna-app` 0.1.49) crashed during publish under system Node 24 with a libuv `UV_HANDLE_CLOSING` assertion. The same command succeeded under the installed Node 22 runtime required by the Anna guide:

```powershell
fnm exec --using=v22.23.2 -- C:\Users\parth\AppData\Roaming\npm\anna-app.cmd apps publish --account https://anna.partners --json
```

Production version `1.0.0` is Anna version id `570`, content hash `904f8fc44e6fe8b110cedce4278b31499fa610921352853782931b5aa36e6649`. It was installed successfully and submitted for public review on 2026-08-24.
