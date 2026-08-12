export const SIGNAL_META_STORAGE_KEY = 'plaza_signal_meta';

export function renderSignalMetaBootstrapScript(): string {
  return `<script>
(function () {
  var key = ${JSON.stringify(SIGNAL_META_STORAGE_KEY)};
  var enabled = localStorage.getItem(key) === 'true';
  document.documentElement.dataset.plazaSignalMeta = enabled ? 'true' : 'false';
})();
</script>`;
}

export function renderSignalMetaScript(): string {
  return `<script>
(function () {
  var KEY = ${JSON.stringify(SIGNAL_META_STORAGE_KEY)};

  function isSignalMetaEnabled() {
    return localStorage.getItem(KEY) === 'true';
  }

  function applySignalMeta(enabled) {
    document.documentElement.dataset.plazaSignalMeta = enabled ? 'true' : 'false';
    var toggle = document.getElementById('plaza-signal-meta-toggle');
    if (toggle) toggle.checked = enabled;
  }

  function initSignalMetaToggle() {
    var toggle = document.getElementById('plaza-signal-meta-toggle');
    if (!toggle) return;
    applySignalMeta(isSignalMetaEnabled());
    toggle.addEventListener('change', function () {
      localStorage.setItem(KEY, toggle.checked ? 'true' : 'false');
      applySignalMeta(toggle.checked);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSignalMetaToggle);
  } else {
    initSignalMetaToggle();
  }
})();
</script>`;
}
