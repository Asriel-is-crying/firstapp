# Android / iOS readiness

Shared today: React Native components, responsive layout, domain types/validation, query hooks, Supabase API services, forms, event/club routes, authorization and scheduling logic. Browser APIs are isolated in platform-specific sharing, URL and date-input modules. The app uses the `campusflow` scheme; image picking uses Expo ImagePicker.

Before native release:

- Configure bundle/application identifiers, owner credentials, native build profiles and store assets.
- Add and test native deep-link handling for Supabase PKCE auth callbacks and recovery, including cold-start links and errors. Browser URL session detection is not a native callback implementation.
- Replace native ISO date text inputs with a native date/time picker and verify timezone behavior.
- Review session storage threat model; AsyncStorage follows the Supabase starter approach but is not encrypted storage. Consider SecureStore-backed adapters with size handling.
- Check safe-area insets, keyboard avoidance, screen-reader labeling, photo permissions and actual iOS/Android device layouts.
- Test share sheets, app links/universal links, notifications if introduced, and media uploads on both platforms.
- Run Android and iOS native builds and device acceptance. Only the web export is a current release target.

Do not fork the domain layer or create separate web/native backend rules. Keep platform differences in small adapters.
