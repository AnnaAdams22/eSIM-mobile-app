# Content rating — questionnaire answers

> Suggested answers for **Google Play's IARC questionnaire** and **Apple's age-rating
> questionnaire**. ESIM Global is a utility/travel commerce app: no objectionable
> content, but it **contains purchases**. Final rating is assigned by the
> questionnaire — these answers produce a low/everyone rating.

## Common facts (true for both)
- **Violence / blood / gore:** None.
- **Sexual content / nudity:** None.
- **Profanity / crude humour:** None.
- **Alcohol, tobacco, drugs:** None.
- **Gambling / simulated gambling:** None.
- **Horror / fear themes:** None.
- **User-generated content / user-to-user communication / social features:** None.
  (No chat, no forums, no sharing, no comments.)
- **Unrestricted web access / in-app browser to arbitrary sites:** No. The in-app
  browser only opens the company's own legal pages and the Android eSIM-setup page.
- **Location sharing:** No.
- **Personal information shared with third parties:** Only processors needed to run
  the service (see privacy docs) — not shared socially or publicly.
- **Digital purchases / commerce:** **Yes** — the app sells eSIM data plans (real
  money, via Stripe). Declare "contains purchases" / "digital purchases".

## Google Play (IARC)
- Category: **Utility / Reference / Travel** (not a game).
- Answer **No** to all violence/sex/drugs/gambling/UGC questions above.
- Answer **Yes** to **"Does the app allow users to purchase digital goods?"** →
  declare purchases. (This typically yields **Rated for 3+ / Everyone**.)
- Data collection is handled in the separate **Data safety** form, not the rating.
- Expected outcome: **Everyone / PEGI 3 / ESRB Everyone** (region dependent).

## Apple (App Store age rating)
- Answer **None** to all content frequency questions (violence, sexual content,
  profanity, horror, gambling, etc.).
- **Unrestricted Web Access:** No.
- **In-app purchases / purchases:** the app has purchases (via Stripe, not IAP) —
  Apple's age-rating questionnaire is about *content*, so the rating itself stays
  low. Expected rating: **4+**.
- No "Made for Kids" / Kids Category — this is a **commercial travel product** not
  directed at children. Do **not** opt into the Kids Category.

## TO CONFIRM
- Whether the client wants to state a **minimum purchase age** in Terms (commercial
  apps commonly require 18+ to purchase) — this is a Terms/Privacy decision, not a
  content-rating flag.
- Re-run both questionnaires in the live consoles at submission; ratings wording
  changes periodically.
