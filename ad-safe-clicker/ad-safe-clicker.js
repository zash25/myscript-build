const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");

const TARGET_URL = "https://daily-nugz-brew.lovable.app/";
const CLICK_DELAY_MS = 3000;
const IDLE_DELAY_MS = 1000;
const MIN_TAB_ALIVE_MS = 10000;
const BLANK_TAB_FALLBACK_CLOSE_MS = MIN_TAB_ALIVE_MS;
const POPUP_WAIT_FOR_READY_MS = 20000;
const POPUP_INTERACTION_BUDGET_MS = 7000;
const POPUP_PROTECTION_EXTRA_MS = 2000;
const AUTO_STOP_AFTER_MS = 10800000;
const MAX_ACTIVE_PROTECTED_TABS = 7;
const BLANK_TAB_SWEEP_INTERVAL_MS = 1200;
const STAGE_WAIT_AFTER_LOAD_MS = 3000;
const STAGE_WAIT_AFTER_RANDOM_MS = 5000;
const CTA_SEQUENCE_INTERVAL_MS = 3000;
const STAGE_WAIT_AFTER_FIRST_CTA_MS = 5000;
const TOP_FIXED_AD_MAX_CLICKS = 5;
const STAGE_WAIT_AFTER_TOP_ADS_MS = 5000;
const BOTTOM_BANNER_SECTION_COUNT = 4;
const BOTTOM_BANNER_ROUNDS = 10;
const BOTTOM_BANNER_MIN_PER_SECTION_BEFORE_REFRESH = 4;
const BALKLIVING_TEXT_PREFIX = "https://balkliving.com/";
const MAX_BALKLIVING_TEXT_LINK_CHECKS = 50;
const ENABLE_PAGE_REFRESH = false;
const TIMED_REFRESH_INTERVAL_MS = 100000;
const HEARTBEAT_INTERVAL_MS = 8000;
const REQUESTFAILED_LOG_THROTTLE_MS = 12000;
const ENABLE_LEGACY_SWEEP_FALLBACK = true;
const CTA_BUTTON_SEQUENCE = [
  ".proceed-cta-button",
  "h1:has-text('Daily Nuggets')",
  ".business-cta-button",
  ".health-cta-button",
  ".safety-cta-button",
  ".funfact-cta-button",
  ".hack-cta-button",
];
const POPUP_ACTION_PAUSE_MS = 350;
const MAX_AD_CLICKS_PER_SWEEP = 7;
const ZONE_RESCAN_MAX_ATTEMPTS = 5;
const MAX_OPENED_TABS_EXCLUDING_TARGET = 15;
const MAX_TABS_TO_CLOSE_PER_CAP_CHECK = 5;
const TAB_CAP_WAIT_POLL_MS = 300;
const TARGET_HOST = new URL(TARGET_URL).hostname;
const DEBUG_AD_LOG = process.env.DEBUG_AD_LOG === "1";
const DEBUG_AD_LOG_FILE =
  process.env.DEBUG_AD_LOG_FILE || "artifacts/ad-debug.log";
const BYTES_PER_MB = 1024 * 1024;
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_2) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:135.0) Gecko/20100101 Firefox/135.0",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Edg/133.0.0.0 Chrome/133.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (iPhone; CPU iPhone OS 18_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.3 Mobile/15E148 Safari/604.1",
  "Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:136.0) Gecko/20100101 Firefox/136.0",
  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:136.0) Gecko/20100101 Firefox/136.0",
];

let userAgentIndex = 0;
let runtimeContext = null;
let runtimeMainPage = null;
let runtimeFirstSeenByPage = null;
const requestFailedLogLastSeen = new Map();
const popupProtectionUntilByPage = new Map();
const popupHandlingPages = new Set();
const trafficSessionByPage = new WeakMap();

function writeAdDebug(event, payload = {}) {
  if (!DEBUG_AD_LOG) return;

  const record = {
    ts: new Date().toISOString(),
    event,
    ...payload,
  };

  const line = JSON.stringify(record);
  console.log(`[ad-debug] ${line}`);

  try {
    fs.mkdirSync(path.dirname(DEBUG_AD_LOG_FILE), { recursive: true });
    fs.appendFileSync(DEBUG_AD_LOG_FILE, `${line}\n`);
  } catch {
    // Best-effort debug logging only.
  }
}

// (trimmed — this file is a direct copy of the repository's ad-safe-clicker.js)

module.exports = { writeAdDebug };
