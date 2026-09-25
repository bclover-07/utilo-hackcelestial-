# Utlio mobile

Native Flutter/Dart client for the existing Express/MongoDB marketplace. `lib/` contains native screens and widgets, not a WebView wrapper. The app uses the same authenticated backend endpoints as the Next.js frontend. There is no demo-data or offline fake-response layer.

## Run

Start the existing backend with its normal configuration from the repository root:

```powershell
npm run dev -w backend
cd mobile
flutter pub get
flutter run --dart-define=API_BASE_URL=http://10.0.2.2:4000/api
```

`10.0.2.2` reaches the host from the Android emulator. For a physical Android device connected by USB, run `adb reverse tcp:4000 tcp:4000` and use `http://127.0.0.1:4000/api`. For a phone on your local network use the host's reachable LAN address. Native debug Android builds permit HTTP; production builds require an HTTPS API URL. Never put backend secrets in Dart defines or app assets.

For a laptop/browser preview:

```powershell
flutter run -d chrome --web-port 3100 --dart-define=API_BASE_URL=http://localhost:4000/api
```

In production, serve Flutter web on the configured frontend origin and proxy `/api` to Express. Cookie authentication requires compatible same-site origins; do not weaken cookie or CORS policy to work around unrelated domains. Native apps send the same session cookie through Dio; persistent cookies use OS-backed secure storage. Logout revokes the server session. API timeouts and validation errors are shown in the UI without automatic mutation retries.

## Screens and real contracts

- Landing, login and business registration; separate administrator login; provider/seeker mode switching through `PATCH /profile`.
- Listings, create/edit, category-specific attribute fields, photos, status, archive and vector indexing through `/listings` and `/uploads`.
- Availability: resource selector, dated quantity blocks, existing reservations and block removal.
- Discovery: category/query/city/coordinates/radius/dates/budget/capacity/quantity/delivery, ranked results, pagination, resource details, reporting, saved resources and saved search filters.
- Requirements: multi-item RFQs, repeat with fresh dates, cancellation and real urgency analysis.
- Quotes: versioned offers, counteroffers, accept/decline, private messages, refresh, conversation tone, negotiation advice and applying a proposed offer to an editable form.
- Bookings: role-specific records, fulfillment transitions gated by dates, cancellation reasons, agreement/offer history, ICS export, reviews and disputes.
- Overview, market analytics, pulse and provider performance: live database aggregates, labeled charts, filter controls, CSV export and real empty states.
- Agent Studio: researcher with source links, quick-match workflow, pricing, demand, operations brief, agent catalog, execution telemetry and editable user memory.
- Conductor: parse brief, edit resource items and exact attribute constraints, dates/location/budget/delivery, build packages, inspect all returned evidence and scenarios, save/open/replan with versions and explicitly approve a package to create RFQs.
- Account: profile, private KYC upload/link; notifications, mark read and related destinations.
- Administration: verification decisions, category/specification editing, policy settings, integration configuration status, audit history, dispute evidence/resolution and moderation holds/release.

The Flutter theme carries the website's cream, yellow, teal, lavender, pink and sky colors; dark borders, offset shadows and bundled DM Sans/Space Grotesk fonts. Narrow screens use a drawer and bottom navigation; wide screens add persistent navigation. Forms scroll with the keyboard. Transitions respect the system's reduced-animation preference. Dense evidence is available through expandable fields rather than being omitted.

## Local AI

WebLLM is a browser/WebGPU runtime. The Next.js app uses its dedicated worker and a Qwen2.5 instruction model. The native Flutter app uses Flutter Gemma's LiteRT-LM engine with the public `litert-community/Qwen3-0.6B` model (586 MB). Flutter web uses the package's preview WebGPU bridge. These are distinct deployment formats; WebLLM model files cannot be loaded directly by the native engine.

The user starts a model download with the AI button. Progress and cancellation are visible. Model files are cached by the runtime. Input text stays on the device; only shared prompt configuration is fetched from authenticated `GET /ai/local-config`. There is no hidden cloud fallback. Device RAM/GPU support, network access to model hosts and available disk space affect startup. Browser tabs or devices without required capabilities get an explicit error. Local output is advice, never automatically published or used to resolve disputes.

Both listing descriptions and fetched conversation messages have local AI controls. Conversation summaries disclose the selected excerpt; larger conversations can be narrowed before generation. Updating source text invalidates the apply button for an older description suggestion. The regular marketplace and cloud agent endpoints continue to work independently of local AI availability.

## Verification

```powershell
flutter analyze
flutter test test/layout_test.dart
# From the repository root; provisions and destroys an isolated Mongo replica:
node backend/scripts/mobile-check.js
# Android development artifact:
cd mobile
flutter build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:4000/api
```

The Dart contract test uses the real Express application, real cookie authentication and a real isolated MongoDB replica set. It covers registration, sessions, listing search, saves, RFQs, chat, offers, booking acceptance/cancellation, agreement/calendar output, analytics and deterministic AI evidence without external AI credentials. Test fixtures never enter the configured development database.

Native iOS compilation and signing require macOS/Xcode. Android release distribution requires your signing configuration. Physical-device inference, external storage/email/voice credentials, and production deployment must be verified in their target environments; successful compilation does not establish those checks.

## References

- [Flutter networking and platform permissions](https://docs.flutter.dev/data-and-backend/networking)
- [WebLLM worker execution](https://webllm.mlc.ai/docs/user/advanced_usage.html)
- [WebLLM supported models and engine options](https://webllm.mlc.ai/docs/user/basic_usage.html)
- [Flutter Gemma](https://pub.dev/packages/flutter_gemma) — this repository pins the compatible package versions in `pubspec.lock`; their installed API is authoritative for this Flutter SDK.
- [Qwen3 native model formats and device measurements](https://huggingface.co/litert-community/Qwen3-0.6B)

No device-independent latency guarantee is made. Benchmark the release build and the chosen model on the actual hackathon demo device.
