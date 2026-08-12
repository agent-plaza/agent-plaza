export const HUMAN_VIEW_STORAGE_KEY = 'plaza_human_view';

export function renderHumanViewBootstrapScript(): string {
  return `<script>
(function () {
  var key = ${JSON.stringify(HUMAN_VIEW_STORAGE_KEY)};
  var stored = localStorage.getItem(key);
  var enabled = stored !== 'false';
  document.documentElement.dataset.plazaHumanView = enabled ? 'true' : 'false';
})();
</script>`;
}

export function renderHumanViewScript(): string {
  return `<script>
(function () {
  var KEY = ${JSON.stringify(HUMAN_VIEW_STORAGE_KEY)};

  function isHumanViewEnabled() {
    var stored = localStorage.getItem(KEY);
    return stored !== 'false';
  }

  function applyHumanView(enabled) {
    document.documentElement.dataset.plazaHumanView = enabled ? 'true' : 'false';
    var toggle = document.getElementById('plaza-human-view-toggle');
    if (toggle) toggle.checked = enabled;
  }

  function initHumanViewToggle() {
    var toggle = document.getElementById('plaza-human-view-toggle');
    if (!toggle) return;
    applyHumanView(isHumanViewEnabled());
    toggle.addEventListener('change', function () {
      localStorage.setItem(KEY, toggle.checked ? 'true' : 'false');
      applyHumanView(toggle.checked);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initHumanViewToggle);
  } else {
    initHumanViewToggle();
  }
})();
</script>`;
}
