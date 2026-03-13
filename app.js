import { createRouter } from "./src/router.js";
import { renderHome } from "./src/routes/home.js";
import { renderApply } from "./src/routes/apply.js";
import { renderCalculator } from "./src/routes/calculator.js";
import { createChat } from "./src/chat/chat.js";
import { storage } from "./src/lib/storage.js";
import { refreshGoldRatesIfStale } from "./src/lib/goldRates.js";

const routeRoot = document.getElementById("routeRoot");
const year = document.getElementById("year");
year.textContent = String(new Date().getFullYear());

storage.ensureDefaults();
(async () => {
  try {
    await refreshGoldRatesIfStale();
  } catch {
    // Non-blocking: demo should still load if API fails.
  }
})();

const router = createRouter(routeRoot, {
  "/": renderHome,
  "/apply": renderApply,
  "/calculator": renderCalculator,
});
router.start();

createChat({
  openBtn: document.getElementById("openChatBtn"),
  closeBtn: document.getElementById("closeChatBtn"),
  overlay: document.getElementById("chatOverlay"),
  panel: document.getElementById("chat"),
  body: document.getElementById("chatBody"),
  form: document.getElementById("chatForm"),
  input: document.getElementById("chatInput"),
  onNavigate: (path) => router.go(path),
});

