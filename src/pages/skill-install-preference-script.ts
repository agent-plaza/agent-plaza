export function renderSkillInstallPreferenceScript(): string {
  return `<script>
(function () {
  var STORAGE_KEY = 'plaza_skill_install_dismissed';
  var details = document.getElementById('plaza-skill-install');
  if (!details) return;

  function dismissInstallPanel() {
    localStorage.setItem(STORAGE_KEY, 'true');
    details.hidden = true;
  }

  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    details.hidden = true;
    return;
  }

  document.querySelectorAll('[data-on-copy-dismiss="plaza-skill-install"]').forEach(function (button) {
    button.addEventListener('click', function () {
      window.setTimeout(dismissInstallPanel, 400);
    });
  });
})();
</script>`;
}
