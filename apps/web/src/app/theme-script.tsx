import { THEME_STORAGE_KEY, THEME_STORAGE_KEY_LEGACY } from "@/lib/theme";

/** Aplica tema antes del paint para evitar FOUC. */
export function ThemeScript() {
  const code = `
(function () {
  var KEY = ${JSON.stringify(THEME_STORAGE_KEY)};
  var LEGACY = ${JSON.stringify(THEME_STORAGE_KEY_LEGACY)};
  var theme = null;
  try {
    theme = localStorage.getItem(KEY) || localStorage.getItem(LEGACY);
    if (!localStorage.getItem(KEY) && localStorage.getItem(LEGACY)) {
      localStorage.setItem(KEY, localStorage.getItem(LEGACY));
    }
  } catch (e) {}
  if (theme !== "light" && theme !== "dark") {
    var path = window.location.pathname || "/";
    if (path.indexOf("/admin") === 0 || path.indexOf("/partner") === 0) {
      theme = "light";
    } else {
      theme = "dark";
    }
  }
  document.documentElement.setAttribute("data-theme", theme);
  document.documentElement.style.colorScheme = theme;
})();
`.trim();

  return (
    <script
      dangerouslySetInnerHTML={{ __html: code }}
      suppressHydrationWarning
    />
  );
}
