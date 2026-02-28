# 版本记录

## v1.0.0-redesign (当前稳定版本)

**标签**: `v1.0.0-redesign`

**发布日期**: 2026-02-28

### 功能特性
- 全新复古胶片暗房美学首页设计
- 打字机效果字幕动画
- 拖拽上传功能
- 响应式布局适配移动端
- 胶片颗粒纹理效果
- 视差滚动效果

### 技术栈
- HTML5 + CSS3 + Vanilla JavaScript
- Google Fonts (Playfair Display, Source Sans 3, IBM Plex Mono)
- 无框架依赖，纯原生实现

### 在线预览
https://redesign-ruddy.vercel.app

### 文件结构
```
├── index.html      # 主页入口
├── styles.css      # 样式文件（复古暗房主题）
├── script.js       # 交互逻辑
└── redesign/       # 设计稿备份目录
    ├── index.html
    ├── styles.css
    └── script.js
```

### 保存位置
- **根目录文件**: 生产环境使用
- **redesign/**: 设计稿备份，包含完整重构版本

---

## 开发分支

- **main/master**: 稳定版本分支
- **develop**: 功能开发分支

### 后续开发建议

1. **新增功能前**
   - 从 develop 分支创建 feature/xxx 分支
   - 完成开发后合并回 develop
   - 测试稳定后合并到 master 并打标签

2. **修改现有功能**
   - 确保基于 master 分支的最新代码
   - 修改前创建备份分支: `git checkout -b backup/yyyymmdd`
   - 小步提交，便于回滚

3. **紧急回滚**
   ```bash
   git checkout v1.0.0-redesign
   git checkout -b hotfix/rollback
   ```
