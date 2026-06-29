/* =========================================================
   STUDY COMPASS — script.js
   Theme memory · welcome popup · dynamic search · pomodoro demo
   ========================================================= */

(() => {
  'use strict';

  /* ---------- 1. CONSTANTS & STATE ---------- */
  const STORAGE_KEY = 'studyCompass.theme';
  const VALID_THEMES = ['morning', 'night', 'library', 'nature'];
  const DEFAULT_THEME = 'morning';

  /* ---------- 2. DOM REFERENCES ---------- */
  const htmlEl       = document.documentElement;
  const welcomeOverlay = document.getElementById('welcome-overlay');
  const welcomeButtons  = document.querySelectorAll('.welcome-theme-btn');
  const themeToggleBtns = document.querySelectorAll('.theme-toggle-btn');
  const searchInput   = document.getElementById('globalSearch');
  const toolCards     = document.querySelectorAll('.tool-card');
  const blogCards     = document.querySelectorAll('.blog-card');
  const noResultsMsg  = document.getElementById('noResultsMsg');
  const mobileMenuBtn = document.getElementById('mobileMenuBtn');
  const mobileNav     = document.getElementById('mobileNav');

  /* ---------- 3. THEME: APPLY / SAVE / GET ---------- */

  /**
   * Apply a theme by setting data-theme on <html>.
   * @param {string} theme - one of VALID_THEMES
   */
  function applyTheme(theme) {
    if (!VALID_THEMES.includes(theme)) theme = DEFAULT_THEME;
    htmlEl.setAttribute('data-theme', theme);

    // Highlight the active toggle icon in the header
    themeToggleBtns.forEach(btn => {
      btn.classList.toggle('is-active', btn.dataset.theme === theme);
    });
  }

  /**
   * Save the theme to localStorage and apply it.
   * @param {string} theme
   * @param {boolean} persist - if true, write to localStorage
   */
  function setTheme(theme, persist = true) {
    applyTheme(theme);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch (err) {
        // localStorage may be unavailable (private mode) — fail silently
        console.warn('Study Compass: could not persist theme.', err);
      }
    }
  }

  /**
   * Read the saved theme. Returns null if none saved.
   * @returns {string|null}
   */
  function getSavedTheme() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return VALID_THEMES.includes(saved) ? saved : null;
    } catch (err) {
      return null;
    }
  }

  /* ---------- 4. WELCOME POPUP ---------- */

  /**
   * Show the welcome popup so the user can pick a theme.
   * Only fired on first visit (no saved theme in localStorage).
   */
  function showWelcomePopup() {
    if (!welcomeOverlay) return;
    welcomeOverlay.classList.add('is-visible');
    welcomeOverlay.setAttribute('aria-hidden', 'false');

    // Trap focus inside the popup for accessibility
    const firstBtn = welcomeOverlay.querySelector('.welcome-theme-btn');
    if (firstBtn) firstBtn.focus();
  }

  function hideWelcomePopup() {
    if (!welcomeOverlay) return;
    welcomeOverlay.classList.remove('is-visible');
    welcomeOverlay.setAttribute('aria-hidden', 'true');
  }

  // Wire up the 4 theme buttons inside the welcome popup
  welcomeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const theme = btn.dataset.theme;
      setTheme(theme);          // persist + apply
      hideWelcomePopup();
    });
  });

  /* ---------- 5. HEADER THEME TOGGLES ---------- */
  themeToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      setTheme(btn.dataset.theme);
    });
  });

  /* ---------- 6. INIT ON PAGE LOAD ---------- */
  // Run ASAP (script has defer, so DOM is ready)
  const savedTheme = getSavedTheme();
  if (savedTheme) {
    // Returning visitor — apply saved theme, no popup
    applyTheme(savedTheme);
  } else {
    // First-time visitor — show popup, default theme for now
    applyTheme(DEFAULT_THEME);
    // Small delay so the popup animates in smoothly after paint
    requestAnimationFrame(() => {
      setTimeout(showWelcomePopup, 400);
    });
  }

  /* ---------- 7. DYNAMIC SEARCH ---------- */
  /**
   * Filter tool cards and blog cards based on the search query.
   * Matches against each card's data-name attribute (lowercased).
   * Cards without a match get .is-hidden (display:none in CSS).
   */
  function handleSearch(event) {
    const query = event.target.value.trim().toLowerCase();
    let visibleToolsCount = 0;
    let visibleBlogCount = 0;

    // Filter tools
    toolCards.forEach(card => {
      const haystack = (card.dataset.name || '') +
                       ' ' + (card.textContent || '').toLowerCase();
      const isMatch = haystack.toLowerCase().includes(query);
      card.classList.toggle('is-hidden', !isMatch);
      if (isMatch) visibleToolsCount++;
    });

    // Filter blog cards
    blogCards.forEach(card => {
      const haystack = (card.dataset.name || '') +
                       ' ' + (card.textContent || '').toLowerCase();
      const isMatch = haystack.toLowerCase().includes(query);
      card.classList.toggle('is-hidden', !isMatch);
      if (isMatch) visibleBlogCount++;
    });

    // Show "no results" only if both grids are empty
    const totalVisible = visibleToolsCount + visibleBlogCount;
    if (noResultsMsg) {
      noResultsMsg.hidden = totalVisible > 0 || query === '';
    }

    // If query is empty, scroll user to the tools section so they see results
    // (we do NOT auto-scroll on empty)
  }

  if (searchInput) {
    // Live filter as the user types
    searchInput.addEventListener('input', handleSearch);
    // Clear on Escape for fast reset
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchInput.value = '';
        handleSearch({ target: { value: '' } });
        searchInput.blur();
      }
    });
  }

  /* ---------- 8. MOBILE MENU ---------- */
  if (mobileMenuBtn && mobileNav) {
    mobileMenuBtn.addEventListener('click', () => {
      const isOpen = mobileNav.classList.toggle('is-open');
      mobileNav.hidden = !isOpen;
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
    });

    // Close mobile menu when a link is tapped
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNav.classList.remove('is-open');
        mobileNav.hidden = true;
        mobileMenuBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- 9. POMODORO TIMER DEMO (tool page template) ---------- */
  // Lightweight demo — shows the tool interface is interactive.
  const timerDisplay    = document.getElementById('timerDisplay');
  const timerModeEl     = document.getElementById('timerMode');
  const startBtn        = document.getElementById('timerStart');
  const pauseBtn        = document.getElementById('timerPause');
  const resetBtn        = document.getElementById('timerReset');
  const sessionsEl      = document.getElementById('sessionsCompleted');

  if (timerDisplay && startBtn) {
    const FOCUS_DURATION  = 25 * 60;  // 25 minutes
    const BREAK_DURATION  = 5  * 60;  // 5 minutes
    let remaining   = FOCUS_DURATION;
    let isFocusMode = true;
    let intervalId  = null;
    let sessions    = 0;

    function formatTime(seconds) {
      const m = String(Math.floor(seconds / 60)).padStart(2, '0');
      const s = String(seconds % 60).padStart(2, '0');
      return `${m}:${s}`;
    }

    function render() {
      timerDisplay.textContent = formatTime(remaining);
      timerModeEl.textContent = isFocusMode ? 'Focus session' : 'Short break';
    }

    function tick() {
      if (remaining > 0) {
        remaining--;
        render();
      } else {
        // Session ended — switch modes
        clearInterval(intervalId);
        intervalId = null;
        if (isFocusMode) {
          sessions++;
          if (sessionsEl) sessionsEl.textContent = sessions;
          isFocusMode = false;
          remaining = BREAK_DURATION;
        } else {
          isFocusMode = true;
          remaining = FOCUS_DURATION;
        }
        render();
        // Auto-start next phase (optional UX — remove if too aggressive)
        startBtn.textContent = 'Start';
      }
    }

    startBtn.addEventListener('click', () => {
      if (intervalId) return; // already running
      intervalId = setInterval(tick, 1000);
      startBtn.textContent = 'Running…';
    });

    pauseBtn.addEventListener('click', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
        startBtn.textContent = 'Resume';
      }
    });

    resetBtn.addEventListener('click', () => {
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
      isFocusMode = true;
      remaining = FOCUS_DURATION;
      sessions = 0;
      if (sessionsEl) sessionsEl.textContent = sessions;
      startBtn.textContent = 'Start';
      render();
    });

    render();
  }

  /* ---------- 10. CLOSE POPUP ON OVERLAY CLICK (UX safety) ---------- */
  // Note: the welcome popup intentionally cannot be dismissed without
  // choosing a theme — this preserves the "remember my choice" promise.
  // But we allow Escape to focus the first button as a courtesy.
  if (welcomeOverlay) {
    welcomeOverlay.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const firstBtn = welcomeOverlay.querySelector('.welcome-theme-btn');
        if (firstBtn) firstBtn.focus();
      }
    });
  }

})();
