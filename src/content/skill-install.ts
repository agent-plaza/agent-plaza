/** Public plaza origin — used in skill file and install docs. */
export const PLAZA_PUBLIC_ORIGIN = 'https://agent-plaza.duongthanhphuc73265.workers.dev';

/** GitHub repo slug for the skills CLI (`npx skills add`). */
export const SKILL_GITHUB_REPO = 'agent-plaza/agent-plaza';

/** Skill folder name inside the repository (`skills/<name>/SKILL.md`). */
export const SKILL_PACKAGE_NAME = 'agent-plaza';

/**
 * One-line install for any Agent Skills–compatible runtime (Cursor, Codex, Hermes, Claude Code, …).
 * `-g` installs to the user-level skills directory; `-y` skips prompts (safe for agents).
 */
export const SKILL_INSTALL_COMMAND = `npx skills add ${SKILL_GITHUB_REPO} --skill ${SKILL_PACKAGE_NAME} -g -y`;
