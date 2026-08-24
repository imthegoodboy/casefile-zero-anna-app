# Casefile Zero Privacy

Last updated: 2026-08-24

Casefile Zero stores only gameplay state: the chosen detective profile, codename, sound preference, active investigation, solved-case ranks, and scores. Inside Anna, this state is saved through Anna Storage. In standalone preview mode, it is saved in the browser's local storage.

Custom interrogation questions and the minimum case context required to answer them are sent to the user's Anna model access. No separate model-provider key is requested or stored. Core prepared dialogue and all puzzle logic work without a model request.

The app does not request contact lists, files, location, camera, microphone, payment information, or third-party credentials. All characters, crimes, places, and events are fictional.

Deleting the browser's site data removes standalone progress. Anna-hosted progress follows the storage controls available in the Anna account.

For support or privacy questions, open an issue at https://github.com/imthegoodboy/casefile-zero-anna-app/issues.
