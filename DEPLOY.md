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
