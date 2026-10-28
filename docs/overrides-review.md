# Package overrides: review of the top 50

Status: **proposed, not applied.** The ratings live in `data/overrides/proposed-top-50.json`. The
sync reads only `data/overrides/packages.json`, so nothing on the site changes until the proposal is
approved and copied there.

These are the 50 packages that appear on the most upstream lists, leaving out the ones TVTidy never
applies (stock launchers, setupwraith, core Android). Each rating is drawn from upstream's own
evidence: how many lists disable the package, how many keep it on purpose, and the comments testers
left. No package here was tested on a TV by us. Quotes are the first line of an upstream comment, so some are cut off.

Ratings, from kit section 5:

- **Safe (27)**: ads, promos, retail demos, telemetry or vendor bloat, disabled widely with
  no reported breakage. Checked by default in the helper.
- **Caution (23)**: an app some people use, or a package where testers reported a side
  effect. The description says what stops working.
- **Keep (0)**: none in this set. The packages that must never be disabled are
  already excluded by the sync.

Effect if applied: 314 of 345 model pages get at least one Safe package (median 5 per page), and
overrides cover a median 46% of each page's rows. Today every row is "Unverified".

## How to approve

Change any row you disagree with in the JSON (or tell me), then:

```bash
cp data/overrides/proposed-top-50.json data/overrides/packages.json
```

```bash
make sync
```

## Safe

| # | Package | Category | Proposed description | Evidence from upstream lists |
|---|---|---|---|---|
| 1 | `com.google.android.feedback` | Telemetry | Google's feedback and crash reporter, which sends reports to Google. Nothing on the TV depends on it. | On 257 lists, kept on 5. Notes: ""send feedback"" |
| 2 | `com.google.android.play.games` | Preinstalled app | Google Play Games, the profile and achievements app. Only games that sign in with Play Games need it. | On 210 lists, kept on 7. Notes: "Play Games" |
| 3 | `com.google.android.partnersetup` | Telemetry | Google Partner Setup: tells Google which partner shipped the TV (referral and attribution pings). Nothing you use depends on it. | On 119 lists, kept on 10. Notes: "partner-app attribution" |
| 4 | `com.google.android.syncadapters.calendar` | Preinstalled app | Syncs Google Calendar in the background. TVs have no calendar app that uses it. | On 100 lists, kept on 10. Notes: "calendar sync" |
| 5 | `com.android.printspooler` | Preinstalled app | Android's print service. A TV has nothing to print from. | On 96 lists, kept on 4. Notes: "printing" |
| 6 | `com.android.tv.feedbackconsent` | Telemetry | The prompt that asks whether to share feedback and diagnostics. Nothing depends on it. | On 71 lists, kept on 1. Notes: "feedback consent prompt" |
| 7 | `com.tcl.esticker` | Ads | TCL's retail-demo sticker: the energy-label and feature overlay shown on store display sets. | On 68 lists, kept on 1. Notes: "retail demo stickers" |
| 8 | `com.android.adservices.api` | Ads | Android's ad services (Privacy Sandbox: Topics and ad attribution). Nothing you watch depends on it. | On 58 lists, kept on 2. Notes: "Privacy Sandbox ad services" |
| 9 | `com.google.android.onetimeinitializer` | Preinstalled app | A task that runs once after first setup and does nothing afterwards. | On 57 lists, kept on 4. Notes: "one-time setup leftovers" |
| 10 | `com.android.ondevicepersonalization.services` | Ads | Android's on-device ad personalisation service, part of Privacy Sandbox. Nothing you watch depends on it. | On 54 lists, kept on 1. Notes: "on-device ad personalisation" |
| 11 | `com.tcl.waterfall.overseas` | Ads | "TCL Channel", TCL's web feed of film and show recommendations. | On 53 lists, kept on 2. Notes: "TCL movie/show recommendation browser" |
| 12 | `com.android.federatedcompute.services` | Telemetry | Federated learning for Android's ad and usage services. Nothing you watch depends on it. | On 52 lists, kept on 1. Notes: "federated learning for the above" |
| 13 | `com.google.android.tv.bugreportsender` | Telemetry | Uploads bug reports to Google automatically. Nothing on the TV depends on it. | On 51 lists, kept on 1. Notes: "bug report uploader" |
| 14 | `android.autoinstalls.config.google.gtvpai` | Ads | Rules that let the Play Store silently install partner apps. Disabling it stops those auto-installs. | On 43 lists, kept on 3. Notes: "silently installs partner apps" |
| 15 | `com.tcl.tv.tclhome_passive` | Ads | Pushes TCL content onto the home screen at boot. | On 42 lists, kept on 1. Notes: "pushes TCL content to the home screen at boot" |
| 16 | `com.tcl.bi` | Telemetry | TCL's analytics service (usage statistics, crash and network reporting). | On 35 lists, kept on 1. Notes: "TCL BI analytics" |
| 17 | `com.xm.webcontent` | Ads | Xiaomi's web container for promotions shown on PatchWall. | On 35 lists, kept on 0. Notes: "Xiaomi promo web content" |
| 18 | `com.miui.tv.analytics` | Telemetry | Xiaomi's TV analytics: collects app usage and logs. | On 34 lists, kept on 0. Notes: "TV usage statistics" |
| 19 | `com.qterics.da.product` | Telemetry | Qterics device agent on Sony TVs: background telemetry for the manufacturer. | On 33 lists, kept on 0. Notes: "Qterics device agent" |
| 20 | `com.sony.dtv.da.service` | Telemetry | Sony's device agent and remote-support service. Re-enable it if Sony support asks to connect to the TV. | On 33 lists, kept on 0. Notes: "Sony device agent / remote support" |
| 21 | `com.sony.dtv.sonyselect` | Ads | Sony Select, Sony's app recommendation tile and promos. | On 33 lists, kept on 0. Notes: "Sony Select app store/promo tile" |
| 22 | `com.tcl.logkit` | Telemetry | TCL's log collector, which captures and uploads logs. | On 33 lists, kept on 3. Notes: "log capture and upload" |
| 23 | `com.tcl.ocean.instructions` | Preinstalled app | TCL's on-screen e-manual and first-run tips. | On 32 lists, kept on 2. Notes: "e-manual" |
| 24 | `com.sony.dtv.multiscreendemo` | Preinstalled app | Sony's in-store multi-screen demo. | On 30 lists, kept on 0. Notes: "Retail multi-screen demo" |
| 25 | `tv.samba.ssm` | Telemetry | Samba TV: automatic content recognition that fingerprints what is on screen to build viewing data. | On 30 lists, kept on 0. Notes: "Samba TV fingerprints what's on screen" |
| 26 | `com.sony.dtv.smarthelp` | Preinstalled app | Sony's Smart Help tile. Keep it if you use the on-TV help. | On 29 lists, kept on 1. Notes: "Sony help tile" |
| 27 | `com.sony.dtv.demosupport` | Preinstalled app | Sony's retail demo support. | On 28 lists, kept on 0. Notes: "Retail demo support" |

## Caution

| # | Package | Category | Proposed description | Evidence from upstream lists |
|---|---|---|---|---|
| 1 | `com.google.android.videos` | Preinstalled app | Google's movie and TV store (Play Movies, later the Google TV app). Disable only if you don't buy or rent films from Google: purchases and that library stop opening. | On 151 lists, kept on 15. Notes: "Play Movies & TV"; kept because: "Google TV movie store" |
| 2 | `com.google.android.tvrecommendations` | Ads | Fills the recommendation rows on the stock home screen. Disabling it empties those rows; on an NVIDIA SHIELD testers keep it enabled, and some firmware turns it back on. | On 135 lists, kept on 11. Notes: "recommendation rows for the stock launcher"; kept because: "and com.google.android.apps.education.cast2class ship" |
| 3 | `com.google.android.youtube.tvmusic` | Preinstalled app | YouTube Music. Disable only if you don't play music with it. | On 131 lists, kept on 23. Notes: "YouTube Music"; kept because: "disabled on the test set" |
| 4 | `com.google.android.katniss` | Preinstalled app | Google Assistant and voice search. Disable only if you don't use voice: the remote's microphone button stops working. | On 113 lists, kept on 51. Notes: "Google Assistant / voice search"; kept because: "Google Assistant voice (mic button)" |
| 5 | `com.google.android.backdrop` | Preinstalled app | Ambient Mode, Google's photo screensaver. Pick another screensaver in Settings first, or the TV has none. | On 74 lists, kept on 13. Notes: "ambient screensaver"; kept because: "ambient screensaver; pick another one in Settings first, or the box has none" |
| 6 | `com.google.android.marvin.talkback` | Preinstalled app | TalkBack, the screen reader. Disable only if nobody in the home needs spoken feedback. | On 67 lists, kept on 10. Notes: "re-enable if you need the screen reader"; kept because: "TalkBack screen reader" |
| 7 | `com.amazon.amazonvideo.livingroom` | Preinstalled app | Prime Video. Disable only if you don't watch Prime Video; the app, and any Prime Video button on the remote, stop working. | On 63 lists, kept on 24. Notes: "Prime Video"; kept because: "Prime Video (Play Store copy)" |
| 8 | `com.tcl.messagebox` | Ads | TCL's pushed messages and promos. Several testers keep it because it also carries a TCL system receiver; disable it only after checking the rest of the TV still works. | On 56 lists, kept on 4. Notes: "TCL push messages and promos"; kept because: "(carries the ttvs receiver), com.tcl.suspension (Quick Panel)." |
| 9 | `com.google.android.apps.tv.dreamx` | Preinstalled app | Google TV's Ambient Mode screensaver, which mixes in recommendations. Switch to another screensaver in Settings first, or the TV has none. | On 52 lists, kept on 20. Notes: "ambient mode; mixes recommendations into the screensaver"; kept because: "Google ambient screensaver (switch to the Clock dream first)" |
| 10 | `com.tcl.usercenter` | Preinstalled app | TCL account sign-in. Disable only if you don't use TCL services; some TCL firmware turns it back on at every boot. | On 49 lists, kept on 5. Notes: "TCL account sign-in nags"; kept because: "at every boot (the ttvs "OverSeasAppShow" service). They are left out of the" |
| 11 | `fusion.android.tv.demo` | Preinstalled app | The retail store demo. On some MediaTek-based TVs the same package handles the remote's Input button, so after disabling it check that Input still opens the source menu. | On 48 lists, kept on 14. Notes: "RetailDisplay store demo"; kept because: "("MtcRetailDisplay"): handles the remote's Input button (TV_INPUT_BUTTON," |
| 12 | `com.tcl.partnercustomizer` | Ads | TCL's promo rows on the Google TV home screen. On some models it also carries the remote's TKey or Inputs button, so check those still work. | On 47 lists, kept on 10. Notes: "TCL tweaks to Google TV home rows"; kept because: "carries the remote's TKey activity" |
| 13 | `com.google.android.apps.mediashell` | Preinstalled app | Chromecast built-in. Disable only if you never cast from a phone or laptop: casting to the TV stops working. | On 46 lists, kept on 63. Notes: "Chromecast built-in"; kept because: "Chromecast (kept by choice)" |
| 14 | `com.tcl.guard` | Preinstalled app | TGuard, TCL's cleaner and app manager. It runs as a persistent system app with an installer service, so test the TV after disabling it. | On 45 lists, kept on 7. Notes: "TCL "cleaner" / app manager"; kept because: "TGuard: TCL cleaner and app manager, starts at boot (BootStartReceiver)" |
| 15 | `com.tcl.smartalexa` | Preinstalled app | TCL's Alexa bridge. Disable only if you don't control the TV with Alexa; some TCL firmware turns it back on at boot. | On 35 lists, kept on 8. Notes: "Alexa"; kept because: "was disabled before the first reboot, but TCL re-enabled it at boot on both units;" |
| 16 | `com.tcl.ui_mediaCenter` | Preinstalled app | TCL's USB and DLNA media player. Disable only if you never play files from a USB drive or home server. | On 35 lists, kept on 9. Notes: "USB media player"; kept because: "USB media player, together with com.tcl.videoplayer" |
| 17 | `com.netflix.ninja` | Preinstalled app | Netflix. Disable only if you don't watch Netflix: the app and the remote's Netflix button stop working. | On 34 lists, kept on 21. Notes: "Netflix"; kept because: "Netflix, together with the next line" |
| 18 | `com.tcl.channelplus` | Ads | TCL's free ad-supported (FAST) channels. Disabling it also removes them from Live TV, so keep it if you watch them. | On 34 lists, kept on 2. Notes: "TCL Live FAST channels"; kept because: "55C728, 65C935, 65C745: TCL's free ad-supported channels" |
| 19 | `com.google.android.leanbacklauncher.recommendations` | Ads | Recommendation rows for the older Android TV home screen. On some models it is tied to the TV's inputs, so check HDMI and Live TV still work after disabling it. | On 31 lists, kept on 1. Notes: "TVINPUT_ALLOW=1 may be needed, see header"; kept because: "tools/disable.sh's TVINPUT_ALLOW safety" |
| 20 | `com.tcl.dashboard` | Ads | The "TCL Home" panel with its gift box and promo messages. Some owners keep it for the TCL Home tile. | On 31 lists, kept on 5. Notes: "TCL Home panel and its promos"; kept because: "TCL Home panel, gift box and promo messages; kept above as a" |
| 21 | `com.google.android.tts` | Preinstalled app | Google text-to-speech. Disable only if nobody uses TalkBack or spoken answers: they stop talking. | On 30 lists, kept on 6. Notes: "text-to-speech"; kept because: "Google text-to-speech, idle once Assistant and TalkBack are off" |
| 22 | `com.google.android.tv.assistant` | Preinstalled app | Google Assistant for TV (voice and the Assistant light). Disable only if you don't use voice: the remote's microphone search stops working. | On 30 lists, kept on 6. Notes: "Assistant LED service"; kept because: "Assistant LED service, same reason" |
| 23 | `com.mstar.android.tv.disclaimercustomization` | Preinstalled app | Disclaimer screens used by first-run setup and retail mode. On laser projectors it may show the laser safety notice, so keep it there. | On 30 lists, kept on 3. Notes: "disclaimer popups"; kept because: "retail disclaimer dialogs; skipped by the same guard, left on" |

## Calls worth a second look

- **`com.google.android.play.games` is Safe.** Games that sign in with Play Games lose that sign-in.
  It is disabled on 210 lists and kept on 7, one of them because it came disabled from the factory.
- **`com.google.android.partnersetup` is Safe.** It is disabled on 119 lists and kept on 10, mostly with
  descriptive notes ("RLZ partner pings"), and none reports breakage. One note says it was untested
  on Sony lists.
- **`com.sony.dtv.da.service` is Safe**, but Sony remote support needs it. The description says to
  re-enable it if support asks.
- **`com.sony.dtv.smarthelp` and `com.tcl.ocean.instructions` are Safe.** They are the on-TV help and
  e-manual; some owners may want them.
- **`fusion.android.tv.demo` is Caution, not Safe**, although it is a retail demo. On several
  MediaTek lists it also handles the remote's Input button.
- **`com.tcl.messagebox`, `com.tcl.partnercustomizer` and `com.tcl.guard` are Caution** because
  testers kept them for system hooks (a TCL receiver, the TKey or Inputs button, a persistent
  installer service).
