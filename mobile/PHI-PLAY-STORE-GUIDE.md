# Prince Haul Intelligence — Put It On The Play Store (Simple Guide)

Your app code is **fixed and tested**: 0 type errors, 37/37 tests passing, production bundle builds clean.

This guide gets you from here to the Google Play Store. Do the ONE-TIME SETUP once, then use the ONE COMMAND anytime you want a new store build.

---

## PART 1 — ONE-TIME SETUP (about 30 minutes, only ever done once)

### Step 1: Make a free Expo account
1. Go to **https://expo.dev** and click **Sign Up**.
2. Remember the email + password you use.

### Step 2: Make a Google Play Console account ($25 one-time fee)
1. Go to **https://play.google.com/console**.
2. Sign in with your Google account, pay the one-time $25 registration fee.
3. Click **Create app**:
   - App name: **PHI - Prince Haul Intelligence**
   - Default language: English (US)
   - App or game: **App**
   - Free or paid: your choice
4. Google may take a few hours to approve your new developer account. That's normal.

### Step 3: Install Node.js on your computer (if you don't have it)
1. Go to **https://nodejs.org** and download the **LTS** version.
2. Install it with all default options (just keep clicking Next).

### Step 4: Get your fixed code
- The fixed code will be on your GitHub repo: `https://github.com/michellemcbean5-droid/phi-app`
- Open **PowerShell** (Windows) and run:
```powershell
cd Desktop
git clone https://github.com/michellemcbean5-droid/phi-app.git
cd phi-app\mobile
npm install
```
(If you don't have git: https://git-scm.com/download/win — install with defaults.)

### Step 5: Log into Expo from your computer (once)
In the same PowerShell window:
```powershell
npx eas-cli login
```
Type the email + password from Step 1.

### Step 6: Link the project to YOUR Expo account (once)
```powershell
npx eas-cli init
```
It prints a project ID. If it asks to overwrite, say yes — this makes the project yours.

---

## PART 2 — THE ONE COMMAND (run this every time you want a Play Store build)

**Windows:** double-click `BUILD-FOR-PLAYSTORE.bat` in the `mobile` folder.

**Mac/Linux:** run `bash BUILD-FOR-PLAYSTORE.sh` in the `mobile` folder.

Or type it yourself in PowerShell:
```powershell
npx eas-cli build --platform android --profile production
```

**What happens:**
- The build runs in the cloud (not on your computer) — takes about 15-25 minutes.
- If it's your first time, it asks "Generate a new Android Keystore?" → press **Y** (this is your app's signing key; Expo stores it safely for you).
- When it's done, it prints a link. Open the link and click **Download** to get your **.aab file**. That .aab is the exact file the Play Store wants.

---

## PART 3 — UPLOAD TO THE PLAY STORE (about 20 minutes, drag and drop)

1. Go to **https://play.google.com/console** and open your app.
2. In the left menu click **Testing → Internal testing** (this is the safest first release — only people you invite can see it).
3. Click **Create new release**.
4. If Google asks about app signing, choose **Let Google manage your app signing key** (recommended) and continue.
5. Drag your downloaded **.aab file** into the **App bundles** box.
6. Give the release a name like `1.0.0 - first release` and click **Next**, fix any warnings it shows (errors must be fixed, warnings are usually OK), then **Save** and **Publish** (or "Send for review").

### Things Play Console will ask you to fill in (all the answers are already written for you):
- **Store listing text** → copy from `mobile/GOOGLE_PLAY_CHECKLIST.md` (title, short + full description are ready)
- **Privacy policy** → a starter policy is at `mobile/docs/privacy-policy.md` — put it on any web page (even a free Google Site) and paste the URL in
- **Content rating questionnaire** → answers are in `mobile/GOOGLE_PLAY_CHECKLIST.md` (Business category, all "None" except location = operational GPS)
- **Screenshots** → run the app on your phone (`npx expo start`, scan the QR code with the Expo Go app) and screenshot the Dashboard, Loads, AI Command Center, Earnings, and Compliance screens

---

## COMMON PROBLEMS

| Problem | Fix |
|---|---|
| "eas: command not found" | Use `npx eas-cli ...` instead of `eas ...` |
| "Not logged in" | Run `npx eas-cli login` again |
| "Project ID mismatch" | Run `npx eas-cli init` and say yes |
| Keystore questions | Always answer **Y** — let Expo manage it |
| Play Console rejects the .aab | Make sure you used the `production` profile, not `preview` |

---

*Everything in the app itself is done. The remaining steps are account setup that only you can do because they're tied to your identity and payment.*
