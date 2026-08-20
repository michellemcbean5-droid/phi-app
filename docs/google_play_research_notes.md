# Google Play Release Research Notes

The following notes summarize official Google Play guidance reviewed on 2026-08-20 and will be reflected in the release handoff materials.

| Topic | Official guidance relevant to PHI | Source |
|---|---|---|
| Privacy policy | Apps that request sensitive permissions or data must link to an active privacy policy in both the Play listing and the app. The policy must explain collection, use, and sharing. | [1] |
| App content | Play Console’s App content page includes privacy policy, ads declaration, sign-in details, target audience, content rating, sensitive-permission declarations, and Data safety. | [1] |
| Data safety | Developers must declare data handling, including handling by third-party SDKs. Public, closed, and open tracks require the Data safety form; an app exclusively on Internal testing is exempt. | [2] |
| Access for review | If all or part of an app is restricted by login or another access restriction, reviewers need working access details and instructions. | [1] |
| Internal testing | Internal testing can distribute a build to up to 100 testers and is recommended before larger tracks. | [3] |
| New personal accounts | Personal Play Console accounts created after 2023-11-13 need a closed test with at least 12 testers continuously opted in for 14 days before applying for production access. | [4] |

## Sources

[1]: https://support.google.com/googleplay/android-developer/answer/9859455?hl=en "Google Play Console Help: Prepare your app for review"
[2]: https://support.google.com/googleplay/android-developer/answer/10787469?hl=en "Google Play Console Help: Provide information for Google Play's Data safety section"
[3]: https://support.google.com/googleplay/android-developer/answer/9845334?hl=en "Google Play Console Help: Set up an open, closed, or internal test"
[4]: https://support.google.com/googleplay/android-developer/answer/14151465?hl=en "Google Play Console Help: App testing requirements for new personal developer accounts"

| Store listing assets | Google Play requires a 512×512 32-bit PNG icon, an 80-character short description, and a 1024×500 JPEG or 24-bit PNG feature graphic. It requires at least two screenshots, with a minimum 320px dimension and maximum 3840px dimension; four 1080px-or-larger screenshots are recommended for app recommendation eligibility. | [5] |
| App bundle | Google Play accepts a signed Android App Bundle and generates optimized APKs for device configurations. Package names are unique and permanent. | [6] |

[5]: https://support.google.com/googleplay/android-developer/answer/9866151?hl=en "Google Play Console Help: Add preview assets to showcase your app"
[6]: https://support.google.com/googleplay/android-developer/answer/9859152?hl=en "Google Play Console Help: Create and set up your app"
