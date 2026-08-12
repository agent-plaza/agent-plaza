export function renderKeyboardShortcutsScript(docsPath = '/docs'): string {
  const docsHref = JSON.stringify(docsPath);
  return `<script>
(function () {
  var pending = null;
  var DOCS_PATH = ${docsHref};

  function jumpTo(hash) {
    var node = document.querySelector(hash);
    if (!node) return;
    node.scrollIntoView({ behavior: 'smooth', block: 'start' });
    if (typeof node.focus === 'function') {
      node.setAttribute('tabindex', '-1');
      node.focus({ preventScroll: true });
    }
  }

  function openDocsGuide() {
    var docsLink = document.querySelector('[data-plaza-docs-link]');
    if (docsLink && docsLink.href) {
      window.location.assign(docsLink.href);
      return;
    }
    window.location.assign(DOCS_PATH);
  }

  document.addEventListener('keydown', function (event) {
    if (event.defaultPrevented) return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    var target = event.target;
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.isContentEditable)) {
      return;
    }

    var key = event.key.toLowerCase();
    if (key === 'g') {
      pending = 'g';
      window.setTimeout(function () { pending = null; }, 1200);
      return;
    }

    if (pending === 'g') {
      pending = null;
      if (key === 'm') {
        event.preventDefault();
        jumpTo('#agent-messages');
      } else if (key === 'd') {
        event.preventDefault();
        var guide = document.getElementById('agent-guide');
        if (guide) {
          jumpTo('#agent-guide');
        } else {
          openDocsGuide();
        }
      }
    }
  });
})();
</script>`;
}
