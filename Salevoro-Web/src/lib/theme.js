// Theme engine: accent ramps, light/dark, bright billing mode, button busy-loader. Exposes window.scTheme.
(function () {
  var ACCENTS = {
    rose: { label: 'Rose', h: 355, c: 0.115 },
    indigo: { label: 'Indigo', h: 289, c: 0.125 },
    gold: { label: 'Champagne', h: 78, c: 0.095 },
    emerald: { label: 'Emerald', h: 165, c: 0.09 },
    blue: { label: 'Sapphire', h: 255, c: 0.11 },
    coral: { label: 'Coral', h: 38, c: 0.12 }
  };
  var L = [0.975, 0.935, 0.87, 0.78, 0.68, 0.58, 0.48, 0.38, 0.29];
  var CS = [0.15, 0.3, 0.55, 0.85, 1, 0.95, 0.8, 0.6, 0.4];
  var N_DARK = ['#f3f5fe', '#e4e7f5', '#cfd3e5', '#b2b6ca', '#9397ab', '#75798c', '#595d6c', '#3f424d', '#292b31'];
  var DEF = { mode: 'light', accent: 'blue' };

  function get() {
    try { var t = JSON.parse(localStorage.getItem('sc_theme') || '{}'); return { mode: t.mode || DEF.mode, accent: ACCENTS[t.accent] ? t.accent : DEF.accent, brightBilling: t.brightBilling !== false }; }
    catch (e) { return { mode: DEF.mode, accent: DEF.accent, brightBilling: true }; }
  }
  function isBilling() { if (window.__scActivePage) return window.__scActivePage === 'billing'; return /^\/billing/i.test(location.pathname); }
  function resolvedMode(t) {
    if (t.brightBilling && isBilling()) return 'light';
    if (t.mode !== 'system') return t.mode;
    return window.matchMedia && matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  }
  function swatch(key) { var a = ACCENTS[key]; return 'oklch(0.68 ' + a.c + ' ' + a.h + ')'; }

  function apply() {
    var t = get(), mode = resolvedMode(t), a = ACCENTS[t.accent], r = document.documentElement.style;
    var acc = L.map(function (l, i) { return 'oklch(' + l + ' ' + (a.c * CS[i]).toFixed(3) + ' ' + a.h + ')'; });
    var neu = N_DARK.slice();
    var light = mode === 'light';
    if (light) { acc.reverse(); neu.reverse(); }
    var text = light ? 'oklch(0.25 0.02 280)' : '#e9e9ed';
    var set = function (k, v) { r.setProperty(k, v); };
    set('--color-bg', light ? 'oklch(0.972 0.005 285)' : '#161826');
    set('--color-surface', light ? 'oklch(0.993 0.003 285)' : '#232532');
    set('--color-text', text);
    set('--color-divider', 'color-mix(in srgb, ' + text + ' 16%, transparent)');
    set('--color-accent', 'oklch(' + (light ? 0.52 : 0.68) + ' ' + a.c + ' ' + a.h + ')');
    set('--color-accent-2', 'oklch(' + (light ? 0.58 : 0.74) + ' ' + (a.c * 0.67).toFixed(3) + ' ' + a.h + ')');
    for (var i = 0; i < 9; i++) {
      var step = (i + 1) * 100;
      set('--color-accent-' + step, acc[i]);
      set('--color-accent-2-' + step, acc[i]);
      set('--color-neutral-' + step, neu[i]);
    }
    set('--shadow-sm', light ? '0 0 0 1px oklch(0.89 0.01 285)' : '0 0 0 1px #3f424d');
    set('--shadow-md', light ? '0 0 0 1px oklch(0.86 0.01 285), 0 6px 18px rgba(30,30,60,0.08)' : '0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)');
    set('--shadow-lg', light ? '0 0 0 1px oklch(0.8 0.01 285), 0 16px 40px rgba(30,30,60,0.16)' : '0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)');
    r.colorScheme = mode;
    document.documentElement.setAttribute('data-theme', mode);
    if (!document.getElementById('sc-paper-vars')) {
      var st = document.createElement('style');
      st.id = 'sc-paper-vars';
      st.textContent = '[data-paper]{' + N_DARK.map(function (v, i) { return '--color-neutral-' + ((i + 1) * 100) + ':' + v; }).join(';') + ';color-scheme:light}';
      document.head.appendChild(st);
    }
  }
  function set(patch) {
    var t = get(); for (var k in patch) t[k] = patch[k];
    localStorage.setItem('sc_theme', JSON.stringify(t));
    apply();
    window.dispatchEvent(new CustomEvent('sc-theme', { detail: t }));
  }
  window.scTheme = { isBilling: isBilling, get: get, set: set, apply: apply, ACCENTS: ACCENTS, swatch: swatch, resolvedMode: function () { return resolvedMode(get()); } };
  apply();
  window.addEventListener('storage', function (e) { if (e.key === 'sc_theme') { apply(); window.dispatchEvent(new CustomEvent('sc-theme')); } });
  if (window.matchMedia) matchMedia('(prefers-color-scheme: light)').addEventListener('change', function () { if (get().mode === 'system') apply(); });
  // Click loader for action buttons (.btn with a text label, or [data-load])
  if (!document.getElementById('sc-busy-css')) {
    var bs = document.createElement('style'); bs.id = 'sc-busy-css';
    bs.textContent = '@keyframes scspin{to{transform:rotate(360deg)}}'
      + '.sc-busy{position:relative!important;pointer-events:none!important}'
      + '.sc-busy,.sc-busy *{color:transparent!important}'
      + '.sc-busy::after{content:"";position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-8px 0 0 -8px;border-radius:50%;border:2px solid var(--color-accent-700);border-top-color:var(--color-accent);animation:scspin .6s linear infinite}';
    (document.head || document.documentElement).appendChild(bs);
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.btn, [data-load]');
    if (!b || b.disabled || b.closest('[data-noload]') || b.classList.contains('sc-busy')) return;
    if (!b.hasAttribute('data-load') && !(b.textContent || '').trim()) return;
    if (b.tagName === 'A' && b.getAttribute('target') === 'work') return;
    b.classList.add('sc-busy');
    setTimeout(function () { b.classList.remove('sc-busy'); }, 550);
  }, true);
})();
