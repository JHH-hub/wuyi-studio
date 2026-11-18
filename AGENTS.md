# AGENTS.md · `wuyi-studio` AI 协作上下文导航

本文档为 AI 编程助手（Claude Code、Antigravity、Cursor、GitHub Copilot、OpenCode 等）提供 `wuyi-studio`（无衣 WUYI · AI 影像艺术工作室「无限影像场」交互网站）的架构说明、源码目录约定、WebGL 渲染边界与验证规范。

---

## 1. 项目定位与关键目录认知（必读）

- **项目性质**：无衣 WUYI（AI 影像创作团队）的全屏三维交互式展示网站，采用原生 WebGL + Canvas 2D 程序化纹理构建，零前端框架、零外部字体或 CDN 依赖。
- **⚠️ 核心目录认知（`dist/` 即源码，非构建产物！）**：
  - 与常规前端项目不同，本仓库的 **`dist/` 是受 Git 跟踪的唯一正式站点源码目录**（`.openai/hosting.json` 直接将 `static.directory` 指向 `"dist"`，`tools/preview.py` 也直接托管 `dist/`）。
  - **所有对线上页面、样式、WebGL 逻辑或内容的修改，必须直接作用于 `dist/` 下的文件**。
  - `artifacts/` 目录（含 `artifacts/previous-site/` 旧版页面备份、`artifacts/flat-field/` 二维平面影像场备份、`artifacts/wordmark/` 字体轮廓实验）已被列入 `.gitignore`，仅作本地历史存档，**不属于当前线上站点代码**。

---

## 2. 核心文件映射表

| 文件 / 目录 | 职责说明 | 修改注意事项 |
| :--- | :--- | :--- |
| `dist/index.html` | 网站主结构、品牌 SVG 线形图标、顶部导航、底部控制栏及 4 个原生 `<dialog>` 弹窗（关于无衣 `#studio-dialog`、实验索引 `#index-dialog`、单帧大图预览 `#frame-dialog`、项目简报下载 `#brief-dialog`） | 脚本按严格顺序通过 `defer` 加载：`field-content.js` → `generative.js` → `space.js` → `field.js`，**切勿打乱加载顺序**。 |
| `dist/field-content.js` | 全站内容配置数据源（`window.WUYI_FIELD_CONTENT`） | 定义团队成员照片 `members`、联系邮箱 `email`、实验影像列表 `images`（`title`、`en`、`src`、`note`、可选 `aspect`）、程序纹理名称 `proceduralNames` 与占位说明。新增或替换作品时优先只改此文件。 |
| `dist/generative.js` | 确定性随机数与 Canvas 2D 程序化纹理生成器（`window.WuyiGenerative`） | 提供基于种子的 `random(seed)`、`hash(x, y, seed)`、3 种模式（`mode = 0/1/2`）的 640×420 程序纹理绘制 `texture(seed, mode)` 及等比裁剪绘制 `cover()`。 |
| `dist/space.js` | 原生 WebGL 三维影像场引擎（`window.WuyiSpace`） | 包含 GLSL 顶点/片元着色器（波浪微弯曲、深度指数雾化、颗粒显影过渡 `u_reveal`、悬停高光）、三维网格分块生成 `tile(x,y,z)`、视锥裁剪与深度排序、2D 投影射线拾取 `hit(x,y)`、纹理上传与容错回退 `prepareSource` / `sourceFor`、自动重混 `remix()`。 |
| `dist/field.js` | 交互控制、相机运动平滑与 UI 绑定 | 管理 URL `?seed=` 解析（默认种子 `261026`）、指针拖拽/双指缩放（Pinch-to-zoom）/滚轮穿行/键盘漫游、闲置自动前行与 8 秒重混、帧率限速（桌面 45 FPS / 触屏 30 FPS）、单帧 PNG 导出与本地 `.txt` 简报生成下载。 |
| `dist/field.css` + `dist/spatial.css` | 样式表 | `field.css` 负责基础变量（石墨黑 `#090909`、暖白、浅青柠点缀）、头部导航、弹窗与响应式；`spatial.css` 负责三维空间居中文案、轻量控制栏与本地文件模式提示条样式。 |
| `dist/assets/` | 静态图像与来源记录 | `member-01~03.webp`（团队照片）、`logo.svg`、`favicon.svg`，以及 `experiments/` 下的 5 张 AI 生成 WebP 影像与生成元数据（`provenance.json`、`prompts-v2.json`）。 |
| `预览网站.cmd` + `tools/preview.py` | 本地 HTTP 预览启动器 | 仅绑定本机回环 `127.0.0.1`，自动从 `4178–4189` 选择空闲端口托管 `dist/` 并打开默认浏览器。 |
| `tools/test-texture-loading.cjs` | WebGL 纹理容错与本地模式回归测试脚本 | 使用 Node.js 内置 `node:vm` 与 `node:assert/strict` 对 `dist/space.js` 进行沙盒单元测试。 |
| `tools/prepare_assets.py` / `tools/refine_wordmark.py` | 离线资产预处理工具（按需手动运行） | `prepare_assets.py`（依赖 Pillow）用于重新生成团队与 Logo WebP；`refine_wordmark.py`（依赖 fontTools）用于将「无衣」二字轮廓嵌入 `dist/assets/logo.svg`（不分发完整字库文件）。 |

---

## 3. 核心架构约束与诚实边界

### 3.1 WebGL 纹理容错与 `file:` 协议降级（强制测试覆盖）
`dist/space.js` 的纹理管线有严格的不变式（由 `tools/test-texture-loading.cjs` 守护）：
1. **本地 `file:` 协议直接跳过 WebGL**：当 `location.protocol === 'file:'` 时，`WuyiSpace` 不请求 WebGL 上下文（`this.available = false`），页面展示静态背景与 `#local-preview-note` 引导用户通过 `预览网站.cmd` 启动 HTTP 预览，规避浏览器 `file://` 跨域画布污染报错。
2. **照片上传失败绝不污染渲染**：在 `prepareSource(source)` 中，即便 `Image` 解码成功（触发 `onload`），若 GPU 纹理上传 `this.upload()` 抛出异常（如 `SecurityError` 或显存分配失败），必须保持 `source.ready = false` 且 `source.texture = null`。
3. **空纹理安全回退**：`sourceFor(tile)` 在检测到目标图片 `!s?.ready || !s.texture` 时，必须自动回退到 6 张已就绪的程序化纹理（`this.sources[this.photoCount + (tile.hash % 6)]`），绝不允许将 `null` 纹理绑定到 WebGL 管线。

### 3.2 性能与无障碍边界
- **显存与缓存控制**：`this.cache` 网格块缓存超过 `1600` 个时自动清理不可见块至 `1100` 个以内；图片纹理按源共享（照片 1024×1024，程序纹理 512×512，启用 `LINEAR_MIPMAP_LINEAR`）。
- **DPR 与帧率上限**：桌面端 DPR 上限 `1.5`（45 FPS），触屏设备（`pointer: coarse`）DPR 上限 `1.25`（30 FPS）；当页面隐藏（`document.hidden`）、`<dialog>` 模态框打开或处于暂停静止状态时停止重绘。
- **减弱动态偏好**：尊重 `prefers-reduced-motion: reduce`，开启时默认暂停自动漫游并关闭平面波浪弯曲动效（`u_motion = 0`）。

### 3.3 内容诚实与隐私原则
- 当前 5 张实验图片均为 AI 生成占位，底部与索引弹窗已明确标注「AI 生成占位与程序纹理 · 非客户作品」；**在用户提供真实商业案例或团队成员真实姓名/职位前，严禁编造客户名称、商业奖项或成员身份**。
- 「开始共创」表单（`#brief-form`）仅在浏览器本地生成 UTF-8 BOM 的 `无衣-项目简报.txt` 供访客下载，不向任何后端发送数据。

---

## 4. 验证与提交流程（Checklist）

每次修改 `dist/` 下的代码后，在 `git commit` 前必须执行：

1. **运行纹理容错与本地模式回归测试**：
   ```powershell
   node tools/test-texture-loading.cjs
   ```
   确认输出 `Texture failure, recovery, null texture and file mode checks passed.` 且退出码为 `0`。
2. **本地 HTTP 预览验证（无浏览器模式自检）**：
   ```powershell
   python tools/preview.py --no-browser
   ```
3. **检查 Git 状态**：运行 `git status -s`，确保 `artifacts/`、`.sites-runtime/` 或临时日志未被提交。
