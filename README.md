# 无衣 WUYI 网站

深色 AI 影像艺术工作室网站。石墨黑、冷白和克制的蓝紫光色，HTML / CSS / JavaScript 独立，无框架、无外部字体或 CDN 依赖。

`dist/index.html` 为入口，可直接双击打开。HTML、CSS、JS 独立，无需安装依赖。

- `dist/styles.css`：布局、字体、响应式、配色。
- `dist/app.js`：动态 KV、菜单、视觉研究弹窗、项目简报下载。
- `dist/content.js`：三位成员展示姓名、联系邮箱、研究介绍。
- `dist/assets/`：已转 WebP 的团队照片、原 Logo 展示稿和重绘的纯路径 `logo.svg`。
- `dist/logo-animation.css`：网站内联 SVG 的首次描线、字标淡入与悬停动画；支持减少动态偏好。`logo.svg` 为独立静态矢量文件，网站动画由 CSS 控制。
- 中文字标采用轻量黑体轮廓，图形与英文路径保留；所有字形均已转路径，不依赖访客字体。`tools/refine_wordmark.py` 可从本机字体重建中文字形，字体文件不随网站分发。
- `dist/dark-theme.css`：深色视觉系统、沉浸式首屏与交互动效；保留基础布局样式，便于独立调整艺术方向。

## 动态与交互

- 首屏三种可切换的程序化光影；三维线束通过 Canvas 投影绘制，不依赖视频下载。
- SVG Logo 描线、标题分行入场、滚动渐入、页面阅读进度、导航定位。
- 作品轻量视差与跟随高光、人物照片缓慢缩放、联系按钮轻微吸附。
- 全局暂停同时控制持续 CSS 动效与 Canvas 时间；减少动态偏好自动静止。触屏关闭指针光环、卡片倾斜与磁吸效果。
- Canvas 仅绘制视口内内容，暂停时仅在尺寸/页面状态改变后重绘，页面隐藏时停止绘制。设备像素比上限 1.5。

照片仅对应提供的三张图片，未推测成员身份、职位。无真实案例、客户、奖项或联系方式时不虚构，视觉研究标注为本站程序化习作。

联系功能当前为诚实的本地简报下载，不发送数据。填写 content.js 的 email 后会显示邮箱链接；如需服务器收件应另行接入。

设计参考研究：https://panoply.co.uk/ 、https://mvsm.com/ 、https://liminal-studio.ai/ 、https://latentlayer.studio/ 。只参考艺术/AI 工作室的信息组织与影像表达，不复制其素材、客户或业绩声明。

预览：在 dist 下运行 `python -m http.server 4178`，打开 http://localhost:4178 。
