# ad-safe-clicker — Discoverable patterns

This folder contains a copy of the project's main script and its runtime artifact used for local inspection.

- **Files:**
  - `ad-safe-clicker/ad-safe-clicker.js` — runtime script (copy)
  - `ad-safe-clicker/artifacts/ad-debug.log` — example debug output

Key, discoverable patterns and exact examples from the codebase

1) Configuration-as-constants at top of file

   - The script centralizes runtime tuning as constants (see `CLICK_DELAY_MS`, `MAX_OPENED_TABS_EXCLUDING_TARGET`, `CTA_BUTTON_SEQUENCE`).
   - Example: the CTA rotation selectors are defined as

     ```js
     const CTA_BUTTON_SEQUENCE = [
       ".proceed-cta-button",
       "h1:has-text('Daily Nuggets')",
       ".business-cta-button",
       ".health-cta-button",
     ];
     ```

   Pattern implication: change behavior by editing these constants (no deep code changes required).

2) Popup detection → guarded interaction → timed close

   - Look at `schedulePopupClose(page, ...)` and `performPopupActionsWithinBudget(popup, budgetMs)` for the exact flow:
     - wait up to `POPUP_WAIT_FOR_READY_MS` for visible content
     - run a bounded set of interactions (`POPUP_INTERACTION_BUDGET_MS`)
     - close and optionally protect briefly via `markPopupProtection`

   Example: the code logs when a popup is treated as protected and enforces a lifecycle timer.

3) Tab-cap enforcement and blank-tab sweeps

   - Functions: `enforceOpenedTabCap`, `enforceOpenedTabCapStrict`, `closeStaleBlankTabs`, and `enforceTabCapBeforeTargetClicks` implement capacity rules.
   - Exact behavior: non-target tabs are closed when exceeding `MAX_OPENED_TABS_EXCLUDING_TARGET`, with at most `MAX_TABS_TO_CLOSE_PER_CAP_CHECK` closed per pass.

4) Instrumentation and optional file logging

   - Enable debug logging by setting `DEBUG_AD_LOG=1` and optionally `DEBUG_AD_LOG_FILE` to change the log path.
   - The runtime uses `writeAdDebug(event, payload)` to append JSON lines to `artifacts/ad-debug.log`.

   Example log line present in `ad-safe-clicker/artifacts/ad-debug.log`:

   ```json
   {"ts":"2026-02-27T07:47:11.859Z","event":"session_start",...}
   ```

5) Stage-driven main loop

   - The runtime annotates work with `setStage(label)` and emits heartbeat lines on `HEARTBEAT_INTERVAL_MS`.
   - Stages are readable strings like `stage-1-random-click`, `stage-4-top-fixed-ads`, `stage-8-pre-refresh-balkliving` and help trace what the loop is doing.

6) Network metering via CDP session

   - `attachTrafficMetering(context, page, runStats, label)` registers a CDP session and increments `runStats.uploadBytes` / `runStats.downloadBytes` from events. The pattern is: create a session per page and listen to `Network.loadingFinished`.

How to run (Windows PowerShell example)

```powershell
$env:DEBUG_AD_LOG = "1"
node ad-safe-clicker/ad-safe-clicker.js
```

Files to inspect for the concrete implementations above

- `ad-safe-clicker.js` (root) — primary implementation and orchestration
- `ad-safe-clicker/ad-safe-clicker.js` — copy for quick review
- `artifacts/ad-debug.log` and `ad-safe-clicker/artifacts/ad-debug.log` — example debug records

This README documents only patterns observable in the repository; it omits aspirational practices.
