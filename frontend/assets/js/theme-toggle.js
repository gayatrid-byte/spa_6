/**
 * ═══════════════════════════════════════════════════════════
 *  THEME TOGGLE SYSTEM
 *  Dark / Light mode with localStorage persistence
 *  and system preference detection.
 * ═══════════════════════════════════════════════════════════
 */
(function initThemeSystem() {
  'use strict';

  const STORAGE_KEY = 'salon-theme-preference';

  /**
   * 1. Determine the initial theme:
   *    a) localStorage override
   *    b) System preference
   *    c) Default → dark
   */
  function getInitialTheme() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;

    // Detect system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }

    return 'dark'; // default
  }

  /**
   * 2. Apply the theme class to <body>
   */
  function applyTheme(theme) {
    document.body.classList.toggle('light-mode', theme === 'light');
    document.body.classList.toggle('dark-mode', theme === 'dark');
    localStorage.setItem(STORAGE_KEY, theme);
    updateToggleIcon(theme);
  }

  /**
   * 3. Update the toggle button icon
   */
  function updateToggleIcon(theme) {
    const btn = document.getElementById('themeToggleBtn');
    if (!btn) return;

    const sunIcon = btn.querySelector('.toggle-icon-sun');
    const moonIcon = btn.querySelector('.toggle-icon-moon');

    if (sunIcon && moonIcon) {
      // CSS handles the visibility via .light-mode selectors
      return;
    }

    // Fallback: direct emoji/text icon
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
  }

  /**
   * 4. Toggle between themes
   */
  function toggleTheme() {
    const current = document.body.classList.contains('light-mode') ? 'light' : 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    applyTheme(next);
  }

  /**
   * 5. Inject the toggle button into the header
   */
  function injectToggleButton() {
    const headerActions = document.querySelector('.header-actions');
    if (!headerActions) return;

    // Avoid duplicate
    if (document.getElementById('themeToggleBtn')) return;

    const btn = document.createElement('button');
    btn.id = 'themeToggleBtn';
    btn.className = 'theme-toggle';
    btn.setAttribute('aria-label', 'Toggle dark/light theme');
    btn.setAttribute('title', 'Toggle theme');
    btn.innerHTML = `
      <span class="toggle-icon-sun" aria-hidden="true">☀️</span>
      <span class="toggle-icon-moon" aria-hidden="true">🌙</span>
    `;
    btn.addEventListener('click', toggleTheme);

    headerActions.prepend(btn);
  }

  /**
   * 6. Listen for system preference changes
   */
  function watchSystemPreference() {
    if (!window.matchMedia) return;

    window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', (e) => {
      // Only auto-switch if user hasn't explicitly set a preference
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        applyTheme(e.matches ? 'light' : 'dark');
      }
    });
  }

  /**
   * 7. Bootstrap on DOM ready
   */
  function bootstrap() {
    const theme = getInitialTheme();
    applyTheme(theme);
    injectToggleButton();
    watchSystemPreference();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

  // Expose for external use
  window.themeSystem = {
    toggle: toggleTheme,
    set: applyTheme,
    get: () => document.body.classList.contains('light-mode') ? 'light' : 'dark'
  };

})();
