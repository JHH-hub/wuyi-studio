# 无衣 WUYI · 无限影像场

AI 影像艺术工作室的全屏交互网站。石墨黑、暖白与少量浅青柠，保留选定的线形图标，以 WUYI 英文字标搭配。HTML、CSS、JavaScript 独立，无框架、外部字体或 CDN 依赖。

## 预览

在仓库目录运行 `python -m http.server 4178 --bind 127.0.0.1 --directory dist`，打开 http://127.0.0.1:4178/ 。也可以直接打开 `dist/index.html`。

## 浏览方式

- 拖动平移，滚轮或双指缩放；Shift + 滚轮横向平移。
- 方向键平移，+ / - 缩放，Home 归位，空格暂停，Enter 打开离中心最近的一帧。
- “另一种可能”切换随机种子并重新构图；URL 可指定数值种子，如 `?seed=261026`。
- 闲置后空间缓慢漂移，每约六秒重排一张可见画面，通过扫描显影过渡。暂停按钮停止漂移和自动更新，仍可主动浏览。
- 点击画面展开并保存 PNG；实验索引提供固定列表，关于无衣展示三张原团队照片。
- “开始共创”仅下载本地 TXT 简报，不上传表单。真实成员姓名及联系渠道尚未提供。

## 文件与内容替换

- `dist/index.html`：页面结构、导航、弹窗、SVG 图标。
- `dist/field.css`：全站布局、响应式、Logo 描线和过渡。
- `dist/field.js`：无限影像场、拖动缩放、显影、画面预览和简报下载。
- `dist/generative.js`：可复现种子的三类程序纹理、图像绘制工具。
- `dist/field-content.js`：成员、影像地址、标题和占位说明。替换图片时修改 `images` 中对应的 `src`、`title`、`note`；目前图像组合按三张设计。
- `dist/assets/experiments/`：三张 AI 生成 WebP 占位。`provenance.json` 记录生成工具、原文件名和提示词摘要。
- `dist/assets/member-*.webp`：用户提供的团队照片。未推测成员身份或职位。

## 占位与性能边界

三张超现实影像由内置 imagegen 预先生成，另外三类纹理由浏览器程序绘制。无限延展指空间与构图的持续变化，并非调用模型生成无限新内容。页面已标注占位与实验性质，未虚构客户案例、业绩或奖项。上线正式作品时应同步更新说明。

画布只绘制视口内帧，缓存限制约 80–100 个布局对象，设备像素比上限 1.5，桌面约 35 FPS、触屏约 25 FPS。页面隐藏时不绘制；暂停后仅在交互或显示状态改变时重绘。尊重系统“减少动态”偏好，默认暂停持续运动。移动端使用更紧凑的空间间距。双指手势已实现，浏览器预览验证涵盖拖动、按钮和键盘，真机触控仍需后续设备确认。

## 设计研究

参考 Infinite Canvas 的无限媒体空间、Paper Warp 的流动纹理以及 Radiant Feedback Loop 的形态延展；本项目交互和纹理为独立 Canvas 2D 实现，未复制其代码或素材。

- https://github.com/edoardolunardi/infinite-canvas
- https://github.com/paper-design/shaders
- https://github.com/pbakaus/radiant

上一版页面备份位于被 Git 忽略的 `artifacts/previous-site/`，Git 历史也保留了之前的版本。
