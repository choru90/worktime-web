# Read-only deployed staging smoke (WT-002)

Run `npm ci`, `npx playwright install --with-deps chromium firefox webkit`, then `npx playwright test --config playwright.staging.config.cjs`.

This independent configuration checks the deployed https://dev.work-time.co.kr login screen, anonymous route guards, required form fields and mobile layout in Chromium/Firefox/WebKit/Pixel 7, plus HTTP health and unauthenticated API protocol. It does not use the disposable suite's data seed/global setup. The original localhost-only E2E safety guard stays intact.

The browser intercepts and aborts every non-GET/HEAD and cross-origin request; attempted writes fail the test. No credentials, authenticated sessions, account signup or store/work-log data are used. API checks issue fixed GETs only. TLS verification remains enabled and there are no retries or test exclusions. Evidence includes JSON/JUnit/HTML, screenshots and failure traces. The workflow has no staging environment, secrets, deployment, APK installation or device access.

This verifies deployed public flows, not employee writes, native Android UI or physical-device behavior. The existing disposable H2/MySQL E2E and mobile API policy suites remain the evidence for authenticated mutation flows. Mobile viewport emulation is not an Android app test.
