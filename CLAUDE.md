# CLAUDE.md · `wuyi-studio` 快速接手指南

> **开始前必读**：请先阅读 [AGENTS.md](./AGENTS.md) 与 [README.md](./README.md)。特别注意：**本仓库的 `dist/` 目录即为受版本控制的唯一主源码目录**，而 `artifacts/` 是被 `.gitignore` 忽略的历史备份目录。

## 1. 仓库速览

- **项目**：无衣 WUYI · AI 影像艺术工作室「无限影像场」交互网站。
- **技术栈**：原生 HTML5 + CSS3 + Vanilla JS（WebGL 1.0 三维空间渲染 `dist/space.js` + Canvas 2D 种子程序化纹理 `dist/generative.js` + 交互控制 `dist/field.js` + 内容数据 `dist/field-content.js`）。
- **零构建步骤**：直接编辑 `dist/` 下的文件即可生效，无需打包编译。

## 2. 常用命令

```powershell
# 1. 运行 WebGL 纹理容错、恢复与 file: 模式单元测试（修改 space.js 后必跑）
node tools/test-texture-loading.cjs

# 2. 启动本地 HTTP 预览服务（监听 127.0.0.1:4178-4189 并自动打开浏览器）
python tools/preview.py
# 或直接双击根目录：预览网站.cmd

# 3. 仅启动本地 HTTP 服务不弹浏览器（用于自动化测试验证）
python tools/preview.py --no-browser
```

## 3. 核心注意事项

1. **编辑位置**：所有站点改动请直接修改 `dist/` 目录下的文件，不要去改 `artifacts/` 下的历史归档副本。
2. **作品与成员更新**：替换或新增展示图片、修改团队成员信息时，只需编辑 `dist/field-content.js` 中的 `window.WUYI_FIELD_CONTENT`，空间网格与实验索引会自动适配新数量。
3. **保持诚实标注**：在未获授权替换正式商业作品前，保留「AI 生成占位与程序纹理 · 非客户作品」说明，不虚构客户案例、奖项或成员履历。
