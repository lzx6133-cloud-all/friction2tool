# Publishing checklist

This file covers the GitHub settings that cannot be stored in the repository.
Repository URLs below assume the repository is `lzx6133-cloud-all/friction2tool`.

## 1. Local repository

```bash
git init -b main
git add .
git commit -m "feat: initial Friction2Tool MVP"
```

## 2. Create the GitHub repository

Suggested repository name:

```text
friction2tool
```

Suggested description:

```text
Turn one everyday friction into a tiny, runnable single-file web tool.
Local-first AI micro-tool generator built with React + Vite.
```

Suggested topics:

```text
ai, llm, react, vite, typescript, openai, local-first, micro-tools, single-file, side-project
```

Then push:

```bash
git remote add origin https://github.com/lzx6133-cloud-all/friction2tool.git
git push -u origin main
```

## 3. Enable GitHub Pages

1. Open **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Open **Actions → Deploy to GitHub Pages** and run it once, or push to `main`.
4. The expected URL is:

```text
https://lzx6133-cloud-all.github.io/friction2tool/
```

5. Confirm the Live Demo URL in `README.md` is reachable after deployment.

## 4. Repository presentation

- Upload `docs/social-preview.png` under **Settings → General → Social preview**.
- Add the Pages URL under **Settings → General → Website**.
- Optionally pin the repository on your GitHub profile.
- Optional badges, after the first Actions run:

```markdown
[![CI](https://github.com/lzx6133-cloud-all/friction2tool/actions/workflows/ci.yml/badge.svg)](https://github.com/lzx6133-cloud-all/friction2tool/actions/workflows/ci.yml)
```

## 5. First release

Create a GitHub Release:

```text
Tag: v0.1.0
Title: Friction2Tool v0.1.0 — local-first MVP
```

Suggested release notes:

```markdown
Initial public MVP.

- Mock mode completes the full friction -> ideas -> HTML tool flow without an API key.
- OpenAI-compatible API settings with provider/model presets, partial key-prefix detection and a connection test.
- Reasoning-model request compatibility and automatic minimal-parameter fallback.
- Sandboxed iframe preview with no-network CSP.
- localStorage persistence, feedback iteration and simple version history.
- HTML export plus JSON backup/restore.
- Accessible modal focus handling; unit and Playwright test suites.
- GitHub Pages deployment and Playwright smoke tests.
```

## 6. Security checks

- Do not commit `.env`, API keys or browser profiles.
- Confirm `node_modules/`, `dist/`, `test-results/` and `playwright-report/` are ignored.
- Read [SECURITY.md](../SECURITY.md) before inviting contributors.
