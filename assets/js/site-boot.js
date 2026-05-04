/**
 * Kloud static asset cache bust — single source of truth.
 *
 * Include this file twice per page (see HTML):
 *   <head> … <script src="./assets/js/site-boot.js" data-phase="1"></script>
 *   </body> … bootstrap bundle, then <script src="./assets/js/site-boot.js" data-phase="2"></script>
 *
 * Bump KLOUD_ASSET_REV only here when you deploy changes to:
 *   assets/css/style.css, assets/css/inline-extracted.css, or assets/js/main.js
 */
(function (global) {
  "use strict";

  /** Bump this string on each deploy that changes local CSS or main.js. */
  var KLOUD_ASSET_REV = "112804052026";

  global.KLOUD_ASSET_REV = KLOUD_ASSET_REV;

  var scriptEl =
    typeof document !== "undefined" && document.currentScript
      ? document.currentScript
      : null;
  var phase = scriptEl && scriptEl.getAttribute("data-phase");
  if (phase !== "1" && phase !== "2") return;

  function injectCss(href) {
    var link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href + "?v=" + encodeURIComponent(KLOUD_ASSET_REV);
    document.head.appendChild(link);
  }

  if (phase === "1") {
    if (global.__kloudSiteBootPhase1) return;
    global.__kloudSiteBootPhase1 = true;
    injectCss("./assets/css/style.css");
    injectCss("./assets/css/inline-extracted.css");
    return;
  }

  if (phase === "2") {
    if (global.__kloudSiteBootPhase2) return;
    global.__kloudSiteBootPhase2 = true;
    var main = document.createElement("script");
    main.src = "./assets/js/main.js?v=" + encodeURIComponent(KLOUD_ASSET_REV);
    document.body.appendChild(main);
  }
})(typeof window !== "undefined" ? window : this);
