# Twilio SMS Setup: Real Phone Verification

To send verification codes to actual phone numbers on sign-up, configure Twilio.

---

## Step 1: Create a Twilio Account

1. Go to [twilio.com](https://www.twilio.com) and sign up (free trial available).
2. Verify your email and phone.

---

## Step 2: Get Credentials

1. Log in to the [Twilio Console](https://console.twilio.com).
2. On the dashboard, find **Account Info**:
   - **Account SID** — Copy this.
   - **Auth Token** — Click the eye icon to reveal, then copy.

---

## Step 3: Get a Phone Number

1. In Twilio Console: **Phone Numbers → Manage → Buy a number**.
2. Select your country, enable **SMS** capability.
3. Choose a number (trial accounts get one free number in supported regions).
4. Copy the number in E.164 format (e.g. `+15551234567`).

---

## Step 4: Configure Your Server

Add to `server/.env` (or Render Environment):

```env
SMS_PROVIDER=twilio
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_FROM_NUMBER=+15551234567
```

Replace with your actual values. **TWILIO_FROM_NUMBER** must be the Twilio number you bought.

---

## Step 5: Restart the Server

- **Local:** Restart `npm run dev`.
- **Render:** Redeploy or the next deploy will pick up env changes.

---

## Verify It Works

1. Open the app and go to the login/sign-up screen.
2. Enter your phone number (with country code, e.g. `+1 555 123 4567`).
3. Tap "Send code".
4. You should receive an SMS: *"Your Do Not Disturb verification code is XXXXXX"*.
5. Enter the code to complete verification.

---

## Is Twilio Free?

**Free trial:** Yes — sign up without a credit card. You get a small preloaded balance to cover a trial phone number and some SMS.

**After trial:** No — you pay per SMS (typically ~$0.0079/SMS in the US). Upgrade when your balance runs out. For low volume (e.g. verification codes only), costs stay small.

---

## Trial Account Limits

- Twilio trial can only send SMS to **verified** phone numbers.
- To verify a number: Twilio Console → Phone Numbers → Verified Caller IDs → Add.
- For production, upgrade your Twilio account to send to any number.

---

## Didn't receive the code? Quick checks

1. **Check server logs** — When mock: `[auth:sms] MOCK MODE – no SMS sent`. If you see that, Twilio isn't configured.
2. **Local dev** — If using localhost and mock mode, the code is shown as **"Dev code: 123456"** on the login screen. Use that.
3. **Configure Twilio** — Add `SMS_PROVIDER=twilio` and all 3 Twilio vars to `server/.env`, then restart the server.
4. **Twilio trial** — Trial accounts only send to **Verified Caller IDs**. Add your phone: Twilio Console → Phone Numbers → Verified Caller IDs → Add your number.
5. **Render** — Add the same Twilio env vars in Render → Environment, then redeploy.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| No SMS received | Check `SMS_PROVIDER=twilio` and all 3 Twilio vars are set. |
| "Unauthorized" error | Verify Account SID and Auth Token are correct. |
| "From number not valid" | Ensure TWILIO_FROM_NUMBER matches your Twilio number exactly (E.164). |
| Trial: "Permission denied" | Add the recipient's number to Verified Caller IDs in Twilio. |
