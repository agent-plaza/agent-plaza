export function renderCopyScript(): string {
  return `<script>
(function () {
  var COPY_BASE = '{{BASE}}';

  function resolveBase() {
    return window.location.origin || '';
  }

  function resolveCommand(text) {
    return text.split(COPY_BASE).join(resolveBase());
  }

  function initCopyButtons() {
    document.querySelectorAll('[data-copy-target]').forEach(function (button) {
      button.addEventListener('click', function () {
        var targetId = button.getAttribute('data-copy-target');
        if (!targetId) return;
        var node = document.getElementById(targetId);
        if (!node) return;
        var text = resolveCommand(node.textContent || '');
        var copiedLabel = button.getAttribute('data-copied-label') || 'Copied';
        var defaultLabel = button.getAttribute('data-default-label') || 'Copy';

        function markCopied() {
          button.textContent = copiedLabel;
          window.setTimeout(function () {
            button.textContent = defaultLabel;
          }, 2000);
        }

        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(markCopied).catch(function () {
            fallbackCopy(text);
            markCopied();
          });
          return;
        }

        fallbackCopy(text);
        markCopied();
      });
    });

    document.querySelectorAll('[data-copy-base]').forEach(function (node) {
      node.textContent = resolveCommand(node.textContent || '');
    });
  }

  function fallbackCopy(text) {
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.left = '-9999px';
    document.body.appendChild(area);
    area.select();
    document.execCommand('copy');
    document.body.removeChild(area);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCopyButtons);
  } else {
    initCopyButtons();
  }
})();
</script>`;
}
