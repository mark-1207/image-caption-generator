# CaptionCraft - Claude Code 开发指南

## 项目概述

图片字幕生成器 - 使用 AI 为图片生成精美字幕的工具

## 当前状态

**稳定版本**: v1.0.0-redesign
**设计风格**: 复古胶片暗房美学
**在线地址**: https://redesign-ruddy.vercel.app

## 分支策略

```
master (稳定版本)
  ↓
develop (开发分支)
  ↓
feature/xxx (功能分支)
```

## 重要文件位置

### 生产文件（根目录）
- `index.html` - 主页
- `styles.css` - 样式
- `script.js` - 脚本

### 备份文件
- `redesign/` - 完整设计稿备份
- `VERSION.md` - 版本记录
- `CLAUDE.md` - 本文件

## 开发工作流

### 开始新功能

```bash
# 1. 切换到开发分支
git checkout develop

# 2. 创建功能分支
git checkout -b feature/new-feature

# 3. 开发完成后合并
git checkout develop
git merge feature/new-feature
```

### 紧急修复

```bash
# 1. 基于稳定版本创建修复分支
git checkout v1.0.0-redesign
git checkout -b hotfix/bug-fix

# 2. 修复后打新版本标签
git tag -a v1.0.1 -m "修复 xxx"
```

## 设计规范

### 颜色系统
```css
--color-bg-primary: #0d0c0b;      /* 主背景 */
--color-bg-secondary: #151412;     /* 次背景 */
--color-accent: #d4a574;           /* 强调色 */
--color-text-primary: #f5f2ed;     /* 主文字 */
--color-text-secondary: #a8a39a;   /* 次文字 */
```

### 字体系统
- 标题: Playfair Display (衬线)
- 正文: Source Sans 3 (无衬线)
- 代码/字幕: IBM Plex Mono (等宽)

## 部署

```bash
# 部署到 Vercel
vercel --prod
```

## 注意事项

1. **不要直接修改 master 分支**，除非紧急情况
2. **每次重大修改前创建标签**，便于回滚
3. **保持 redesign/ 目录同步**，作为设计备份
4. **修改后及时更新 VERSION.md**
