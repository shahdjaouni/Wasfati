# طبختي

مساعد طبخ عربي للجوال. تحفظ وصفاتك، ترتب ثلاجتك، ويقترح عليك طبخة اليوم حسب الموجود. الناقص ينتقل إلى قائمة المشتريات، ومنها تُفتح رسالة واتساب جاهزة لسوبرماركتك.

The interface is Arabic and right-to-left. It runs on Android and iPhone with Expo, and in the browser for development.

## What it does

- **اليوم** — one suggestion card: dish, circular photo, `عندك 7 من 8`, what you already have (**من ثلاجتك**), what you still need (**ناقصك**), and **اقتراح ثاني**.
- **وصفاتي** — name, ingredients with a category, steps, and a small dish photo.
- **ثلاجتي** — inventory grouped into خضار، مونة، بهارات، and سوائل.
- **المشتريات** — add missing ingredients in one tap. A WhatsApp button builds an Arabic message and opens `wa.me` addressed to the supermarket number saved in settings. You press send yourself.
- **الإعدادات** — OpenAI-compatible API base URL, model, and API key. The key is stored with `expo-secure-store` on device (web preview falls back to `localStorage` because SecureStore is not available there). With no key, suggestions use local matching. Optional daily local notification to review and send the shopping list.

Ingredient counts are always computed on the device, ingredient by ingredient, even when a model picks or writes the recipe. Names match across spelling differences such as بندورة / طماطم and أرز / رز.

The first launch seeds a few recipes and a fridge so the home card can show a real gap (مقلوبة خضار is missing باذنجان). Restore or clear that sample data from settings.

## Setup

Requires Node.js 22.

```bash
npm install
npm test
npm run typecheck
npx expo start
```

Then:

- Press `a` for Android or scan the QR code with Expo Go.
- Press `i` for the iOS simulator (macOS).
- `npm run web` opens the browser preview.

## Android APK

`eas.json` has a preview profile that produces an APK (`eas build -p android --profile preview`). A local build does not need an Expo account:

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

The debug APK is installable with `adb install`. When a build is produced in this repo it is copied to `release/tabkha.apk`.

## Project map

- `src/core` — matching, ranking, shopping message, phone normalization. Covered by Vitest.
- `src/ai` — swappable OpenAI-compatible client plus local fallback.
- `src/data` — AsyncStorage repository. The API key stays out of that JSON.
- `app/` — Expo Router screens and the bottom navigation: اليوم، وصفاتي، ثلاجتي، المشتريات.

Palette: background `#FFF9F5`, cards `#FBE7DB`, accent `#F2BFA2`, buttons `#D98C6A`, text `#5A4036`.
