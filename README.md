# 无衣 WUYI 网站

`dist/index.html` 为入口，可直接双击打开。HTML、CSS、JS 独立，无需安装依赖。

- `dist/styles.css`：布局、字体、响应式、配色。
- `dist/app.js`：动态 KV、菜单、视觉研究弹窗、项目简报下载。
- `dist/content.js`：三位成员展示姓名、联系邮箱、研究介绍。
- `dist/assets/`：已转 WebP 的团队照片、原 Logo 展示稿和重绘的纯路径 `logo.svg`。
- `dist/logo-animation.css`：网站内联 SVG 的首次描线、字标淡入与悬停动画；支持减少动态偏好。`logo.svg` 为独立静态矢量文件，网站动画由 CSS 控制。

照片仅对应提供的三张图片，未推测成员身份、职位。无真实案例、客户、奖项或联系方式时不虚构，视觉研究标注为本站程序化习作。

联系功能当前为诚实的本地简报下载，不发送数据。填写 content.js 的 email 后会显示邮箱链接；如需服务器收件应另行接入。

设计参考研究：https://panoply.co.uk/ 、https://mvsm.com/ 。只参考艺术工作室的信息组织与影像表达，不复制其素材。

预览：在 dist 下运行 `python -m http.server 4178`，打开 http://localhost:4178 。
