# Account deletion — web page text for esim-global.net/delete-account

> **Why this exists:** Google Play requires a publicly reachable **web URL** where
> users can request account and data deletion — not only an in-app path. Publish the
> text below at **https://esim-global.net/delete-account** and enter that URL in the
> Play Console Data safety form **before** submitting the app.
>
> The steps and the "kept vs deleted" list below match what the backend actually
> does on account deletion. Keep them in sync if the backend changes.

---

## Delete your ESIM Global account

You can delete your ESIM Global account and associated data at any time. There are
two ways to do it.

### Option 1 — Delete it yourself in the app (fastest)

1. Open the **ESIM Global** app and sign in.
2. Go to **Profile → Delete account**.
3. Read the summary, type **DELETE** to confirm, and tap **Delete account**.

Your account is deleted straight away and you are signed out. If you have an order
still being processed, the app will ask you to try again once it has finished.

### Option 2 — Request deletion by email

If you can't access the app, email **info@esim-global.net** from the **same email
address** you use for your ESIM Global account, with the subject **"Delete my
account"**. We use the sending address to verify the request and will delete the
account. Please allow a few business days.

---

### What is deleted

- Your sign-in account and profile (email, name, password).
- Your saved payment profile with our payment provider (Stripe customer record).
- Your notification/device registrations (so you stop receiving push alerts).

### What is kept, and why

- **Order and purchase records** (which plan was bought, amount, date) are **kept**
  but **detached from your account**. We are required to retain these for
  accounting, tax and legal reasons. They are no longer linked to your login.
- Any eSIM you already installed on your device keeps working until its data or
  validity runs out — deleting your account does not switch off an active eSIM.

> **TO CONFIRM (client):** the exact retention period for detached order records
> (set by your accounting/legal advice, e.g. "up to 7 years"). State it here.

### Questions

Email **info@esim-global.net** and we'll help.

---

## Publishing notes (for the client — not part of the page)

- The page must be **public** (no login) and live **before** Google Play submission.
- Link it from the website footer and ideally from the Privacy Policy.
- The in-app steps above assume the current app (Profile → Delete account). If the
  menu label changes, update this page.
- **TO CONFIRM:** confirm `info@esim-global.net` is the correct, monitored support
  inbox for deletion requests (it is the sender used by the backend and Supabase).
