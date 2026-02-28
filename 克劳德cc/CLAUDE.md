# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Structure

This is a collection of Chinese-language tools and Claude Skills. The repository is organized into separate project directories:

```
克劳德cc/               # Current directory - Claude Skills
  skills/
    weibo-hotsearch-analyst/SKILL.md  # Weibo hot search analysis skill

图片字幕生成器/           # Image caption generator (HTML/CSS/JS)
  - index.html
  - app.js
  - style.css
  - prd.md              # Product requirements document

微博热搜/                 # Weibo hot search analysis outputs
```

## Project Types

### 1. Claude Skills (`skills/`)

Skills are defined in Markdown files with YAML frontmatter:

```yaml
---
name: skill-name
description: "Skill description"
---
```

Key patterns:
- Each skill has its own subdirectory under `skills/`
- Main definition file is always named `SKILL.md`
- Documentation is written in Chinese
- Skills use standard Claude Code tools (WebSearch, Bash, etc.)

### 2. Static Web Tools (`图片字幕生成器/`)

Pure client-side HTML/CSS/JS applications:
- No build step required
- Open `index.html` directly in browser to run
- All processing happens client-side (Canvas API for image manipulation)

## Development Workflow

### For Claude Skills
1. Edit `SKILL.md` files directly
2. Test by invoking the skill in Claude Code with `/技能` or natural language
3. Skills take effect immediately after saving

### For Web Tools
1. Edit HTML/CSS/JS files
2. Open files directly in browser (no server needed)
3. For the image caption generator: supports JPG/PNG/WEBP up to 20MB

## File Patterns

- Product requirements: `prd.md` - Contains detailed feature specifications in Chinese
- Skill definitions: `SKILL.md` - Claude Skill manifest with usage instructions
- Settings: `.claude/settings.local.json` - Claude Code configuration
