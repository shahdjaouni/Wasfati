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
```

`npm run web` opens a browser preview. iOS simulator (macOS): `npm run ios`.

لتجربة التطبيق على الهاتف بدون حاسوب، ثبّت نسخة المعاينة أدناه. نسخة التطوير تبقى لمن يريد رؤية التعديلات مباشرة من Metro.

## نسخة المعاينة (بدون خادم تطوير)

ملف التثبيت: [`release/tabkha-preview.apk`](release/tabkha-preview.apk) (32,927,847 بايت، معالج arm64 فقط، الإصدار 1.1.2، versionCode 4).

هذه نسخة جاهزة. جافاسكربت مضمّن داخل الملف، فالتطبيق يفتح مثل أي تطبيق مثبّت ولا يطلب عنوان Metro أو نفقاً. صفحة اليوم تعرض طبق الاقتراح، وهدف الطبخ الأسبوعي (افتراضياً 3 أيام من السبت للجمعة)، وتفاصيل الوصفة إن وُجدت، وفلاتر تعمل، وتنبيهاً لمكوّن قديم في الثلاجة إن كان تاريخ إضافته محفوظاً. الشريط السفلي كما هو. انقل الملف إلى هاتف أندرويد (64-bit) وافتحه. التثبيت فوق 1.1.1 (أو 1.0.0) يحدّث التطبيق ويُبقي الوصفات والثلاجة. إذا طلب النظام إذناً، اسمح بالتثبيت من هذا المصدر.

تُوقَّع بمفتاح تصحيح أندرويد نفسه حتى يقدر التحديث يمر، وليست نسخة متجر. الحزمة `com.tabkha.app`.

## تثبيت نسخة التطوير على أندرويد

ملف التثبيت: [`release/tabkha-dev-client.apk`](release/tabkha-dev-client.apk) (حوالي 89 ميغابايت، معالج arm64 فقط).

هذه نسخة تطوير (Expo Dev Client) وليست نسخة المتجر. تُثبَّت على الهاتف مرة واحدة، ثم تتصل بالحاسوب لتعرض آخر نسخة من الكود.

1. انقل الملف إلى هاتف أندرويد (64-bit، وهو حال أغلب الأجهزة) وافتحه. إذا طلب النظام إذناً، اسمح بالتثبيت من هذا المصدر.
2. على الحاسوب، داخل مجلد المشروع، وثبّت الحزم إن لم تكن مثبتة:

```bash
npm install
npx expo start --dev-client
```

أو `npm start`.

3. الهاتف والحاسوب على **نفس الواي فاي**: افتح تطبيق طبختي. من شاشة التطوير امسح رمز QR الظاهر في الطرفية، أو اختر الخادم الذي يظهر على الشبكة. اترك أمر الطرفية يعمل.
4. الهاتف على بيانات الجوال، أو على شبكة لا تصل إلى الحاسوب: شغّل نفقاً عبر الإنترنت:

```bash
npx expo start --dev-client --tunnel
```

أو `npm run tunnel`. انتظر حتى يظهر رابط النفق ثم افتحه من شاشة التطوير في التطبيق. الاتصال الأول قد يأخذ نصف دقيقة.

5. بعد الاتصال، حفظ ملف في المشروع يعيد تحميل التطبيق. لإعادة التحميل يدوياً اضغط `r` في الطرفية، أو رجّ الهاتف وافتح قائمة المطوّر.

إغلاق الطرفية يوقف تحميل التعديلات. التطبيق يبقى مثبتاً، وتعيد تشغيل الأمر عندما تريد المتابعة. بدون `--tunnel` يجب أن يصل الهاتف إلى منفذ `8081` على الحاسوب.

## Standalone preview APK

The installable file is [`release/tabkha-preview.apk`](release/tabkha-preview.apk) (32,927,847 bytes, arm64-v8a only, version 1.1.2, versionCode 4). JavaScript and the Arabic fonts are bundled inside the APK, so طبختي opens like a normal installed app. No Metro server and no tunnel URL. Home now records a cooking day when you tap يلا نطبخها, shows a recipe's minutes, servings, and kind only when those fields exist, filters suggestions from those fields, and shows استعمليه قريباً only for a pantry item with a real added date. The weekly target (default 3 days, Saturday through Friday) is editable in settings. RTL from 1.1.1 is unchanged.

Copy it to a 64-bit Android phone and open it. Installing over the 1.1.1 preview keeps local recipes and pantry data. Allow installation from that source if Android asks. It is signed with the same Android debug key so the update can replace the previous preview; it is not a Play Store build. Package name: `com.tabkha.app`.

Built locally with `./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a` after `npx expo prebuild --platform android` (the same shape as the `preview` profile in `eas.json`: an internal APK, not a dev client).

## Install the Android development build

The installable file is [`release/tabkha-dev-client.apk`](release/tabkha-dev-client.apk) (about 89 MB, arm64-v8a only). It is a debug **Expo Dev Client** signed with the Android debug key. It is the native shell; JavaScript comes from the dev server on your computer, which is how live edits reach the phone.

1. Copy the APK to the phone and open it. Allow installation from that source if Android asks.
2. On the computer, in this project:

```bash
npm install
npx expo start --dev-client
```

3. Same Wi-Fi: open طبختي, then scan the terminal QR code from the dev-client screen, or pick the server discovered on the LAN. Leave the terminal running.
4. Phone on cellular data, or on a network that cannot reach the computer:

```bash
npx expo start --dev-client --tunnel
```

Wait for the tunnel URL, then open it from the dev-client screen. The first tunnel can take a little while.

5. Saving a file reloads the app. Press `r` in the terminal to reload manually, or shake the phone for the developer menu.

Stop the terminal and the phone stops receiving new code. Start the command again to reconnect. Without `--tunnel`, the phone must be able to reach port `8081` on the computer.

To rebuild this APK locally (no Expo account):

```bash
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug -PreactNativeArchitectures=arm64-v8a
```

Copy `android/app/build/outputs/apk/debug/app-debug.apk` to `release/tabkha-dev-client.apk`. `eas.json` also has a `development` profile (`developmentClient: true`, debug APK) for `eas build -p android --profile development`.

## Project map

- `src/core` — matching, ranking, shopping message, phone normalization. Covered by Vitest.
- `src/ai` — swappable OpenAI-compatible client plus local fallback.
- `src/data` — AsyncStorage repository. The API key stays out of that JSON.
- `app/` — Expo Router screens and the bottom navigation: اليوم، وصفاتي، ثلاجتي، المشتريات.

Palette: background `#FFF9F5`, cards `#FBE7DB`, accent `#F2BFA2`, buttons `#D98C6A`, text `#5A4036`.
