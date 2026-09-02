// dsh-ds-home-bg — DeepSeek Harness 背景主题插件（深/浅双主题）
//
// 把 Web UI 背景替换为 deepseek.com/harness 官网同款：
//   - 深色（晚上）：深蓝黑底色 (#0B1120) + 三层蓝色径向光晕 + 蓝色细网格 + 浅蓝点阵鲸鱼
//   - 浅色（白天）：浅蓝白底 (#EEF3FA) + 柔和蓝光晕 + 深蓝点阵鲸鱼
//   - 主题切换在设置面板「外观」分组（v7.5 起皮肤三选一融入系统外观组，同位置二选一展示）：
//     浅海模式 / 深海模式 / 跟随系统，持久化在 localStorage('dsh-ds-home-bg-mode')
// 实现机制：监听 webserver/index-inject 事件，沿用官方主题插件同款注入 API
//   - kind:'style' / 默认 placement=head → 注入主题变量 + 光晕 CSS
//   - kind:'html'  / placement=body       → 注入光晕装饰层 div（注意字段名是 row.html）
// 光晕浮在最上层（z-index 99998）但 pointer-events: none，不影响 UI 交互。

const DEFAULTS = {
  base: "#0B1120",          // 底色
  glow1: "#1A3870",         // 左下光晕
  glow2: "#4A8AC4",         // 中上光晕
  glow3: "#2D5F9E",         // 右下光晕
  grid: "rgba(74, 138, 196, 0.06)", // 网格线
  blur: 140,                // 光晕模糊半径 px
  opacity: 0.45,            // 光晕整体强度
  animation: true,          // 是否开启动画
};

// 浅色主题（白天）配色 —— 与深色共用同一套布局，仅换色板。
// 切换机制：boot script 依系统外观偏好镜像(dsh-ds-home-bg-syspref) 或系统
// prefers-color-scheme 决定 data-ds-bg-mode = "dark" | "light"，
// 所有颜色经 CSS 变量引用，两套主题零重复规则。
const LIGHT_PALETTE = {
  base: "#EEF3FA",                     // 浅蓝白底
  glow1: "#A9C8F0",                    // 左下柔光
  glow2: "#D7E6F9",                    // 中上亮光
  glow3: "#8FB8E8",                    // 右下柔光
  grid: "rgba(45, 92, 158, 0.07)",     // 浅色网格线
  text: "#334155",                     // 基础文字色
  whaleDot: "rgba(70, 110, 165, 0.5)", // 浅底上用深蓝点阵
};

// 官网 hero 点阵鲸鱼：path 取自 deepseek.com/harness/images/hero-whale.svg
// 渲染方式：SVG pattern 方点阵填充（复刻官网 halftone 效果，零 canvas 零依赖）
const WHALE_PATH = "M22.9168 1.43018C22.6713 1.31018 22.5658 1.53918 22.4223 1.65519C22.3733 1.69269 22.3318 1.74169 22.2903 1.78669C21.9317 2.1697 21.5127 2.42121 20.9657 2.39121C20.1657 2.34621 19.4827 2.59771 18.8787 3.20973C18.7502 2.45521 18.3236 2.0047 17.6746 1.71569C17.3351 1.56568 16.9916 1.41518 16.7536 1.08867C16.5876 0.856163 16.5421 0.597155 16.4591 0.341647C16.4061 0.187643 16.3536 0.0301382 16.1761 0.00363739C15.9836 -0.0263635 15.9081 0.135141 15.8326 0.270145C15.5306 0.822162 15.4136 1.43018 15.4251 2.0462C15.4516 3.43174 16.0366 4.53527 17.1991 5.3203C17.3311 5.4103 17.3651 5.5003 17.3236 5.63181C17.2441 5.90231 17.1501 6.16482 17.0671 6.43533C17.0141 6.60784 16.9351 6.64584 16.7501 6.57033C16.1121 6.30383 15.5611 5.90931 15.074 5.4328C14.2475 4.63328 13.5 3.75075 12.568 3.05973C12.349 2.89822 12.13 2.74822 11.9034 2.60522C10.9524 1.68169 12.028 0.923165 12.277 0.833162C12.5375 0.739159 12.3675 0.41615 11.5259 0.42015C10.6844 0.42365 9.91439 0.705658 8.93286 1.08117C8.78935 1.13767 8.63835 1.17867 8.48384 1.21267C7.59332 1.04367 6.66829 1.00617 5.70226 1.11517C3.88321 1.31768 2.43016 2.1777 1.36213 3.64575C0.0790928 5.4103 -0.222916 7.41536 0.146595 9.50642C0.535106 11.7105 1.66014 13.535 3.38869 14.9616C5.18125 16.4406 7.24581 17.1657 9.60138 17.0266C11.0319 16.9441 12.6245 16.7526 14.421 15.2321C14.874 15.4576 15.3496 15.5476 16.1381 15.6151C16.7456 15.6716 17.3306 15.5851 17.7836 15.4911C18.4931 15.3411 18.4441 14.6841 18.1876 14.5636C16.1081 13.595 16.5646 13.9891 16.1496 13.67C17.2061 12.42 18.8202 10.1979 19.3182 7.17235C19.3672 6.83834 19.4297 6.36783 19.4222 6.09732C19.4182 5.93231 19.4562 5.86831 19.6447 5.84931C20.1657 5.78931 20.6712 5.64681 21.1357 5.3913C22.4833 4.65528 23.0268 3.44624 23.1548 1.9972C23.1738 1.77569 23.1508 1.54668 22.9168 1.43018ZM11.1749 14.4736C9.15936 12.889 8.18184 12.3675 7.77832 12.39C7.40081 12.4125 7.46881 12.8445 7.55182 13.126C7.63882 13.404 7.75182 13.5955 7.91033 13.8396C8.01983 14.0011 8.09533 14.2411 7.80083 14.4216C7.15181 14.8231 6.02327 14.2866 5.97027 14.2601C4.65673 13.4865 3.5587 12.4655 2.78467 11.069C2.03715 9.72493 1.60314 8.28289 1.53164 6.74384C1.51264 6.37233 1.62214 6.24082 1.99215 6.17332C2.47916 6.08332 2.98118 6.06432 3.46769 6.13582C5.52476 6.43633 7.27581 7.35586 8.74385 8.8129C9.58188 9.64243 10.2159 10.634 10.8689 11.6025C11.5634 12.631 12.3105 13.611 13.262 14.4146C13.598 14.6961 13.866 14.9101 14.1225 15.0681C13.349 15.1546 12.058 15.1731 11.1749 14.4746V14.4736ZM12.141 8.25988C12.141 8.09488 12.273 7.96338 12.439 7.96338C12.4765 7.96338 12.5105 7.97088 12.541 7.98188C12.5825 7.99688 12.6205 8.01938 12.6505 8.05338C12.7035 8.10588 12.7335 8.18088 12.7335 8.25988C12.7335 8.42489 12.6015 8.55639 12.4355 8.55639C12.2695 8.55639 12.141 8.42489 12.141 8.25988ZM15.1415 9.79893C14.949 9.87793 14.7565 9.94544 14.5715 9.95294C14.2845 9.96794 13.9715 9.85143 13.8015 9.70893C13.5375 9.48742 13.3485 9.36342 13.2695 8.97691C13.2355 8.8119 13.2545 8.55639 13.2845 8.40989C13.3525 8.09438 13.277 7.89187 13.0545 7.70787C12.8735 7.55786 12.643 7.51636 12.39 7.51636C12.2955 7.51636 12.209 7.47486 12.1445 7.44136C12.039 7.38886 11.9519 7.25735 12.035 7.09585C12.0615 7.04335 12.19 6.91584 12.22 6.89334C12.5635 6.69784 12.9595 6.76184 13.326 6.90834C13.6655 7.04735 13.9225 7.30236 14.292 7.66287C14.6695 8.09838 14.7375 8.21838 14.9525 8.54539C15.1225 8.8009 15.277 9.06341 15.3831 9.36392C15.4471 9.55142 15.3641 9.70493 15.1415 9.79893Z";

// 颜色辅助：把 #RRGGBB 或 rgba() 转成 r,g,a 形式（用于 background-color 与 box-shadow）
function hexToRgb(hex) {
  const m = hex.replace("#", "");
  const v = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return `${(v >> 16) & 255}, ${(v >> 8) & 255}, ${v & 255}`;
}

function buildCss(cfg) {
  const c1 = hexToRgb(cfg.glow1);
  const c2 = hexToRgb(cfg.glow2);
  const c3 = hexToRgb(cfg.glow3);
  const l1 = hexToRgb(LIGHT_PALETTE.glow1);
  const l2 = hexToRgb(LIGHT_PALETTE.glow2);
  const l3 = hexToRgb(LIGHT_PALETTE.glow3);
  return `
/* === [v5] 模式变量：深色 / 浅色两套色板，由 data-ds-bg-mode 切换 ===
   boot script 依 localStorage 或系统偏好设置该属性；下方所有规则经 var() 引用。 */
html[data-ds-bg-mode="dark"], html[data-ds-bg-mode="dark"] body {
  color-scheme: dark !important;
  --ds-base: ${cfg.base};
  --ds-text: #cbd5e1;
  --ds-grid: ${cfg.grid};
  --ds-glow-1: radial-gradient(circle, rgba(${c1}, 0.95) 0%, transparent 70%);
  --ds-glow-2: radial-gradient(circle, rgba(${c2}, 0.95) 0%, rgba(${c3}, 0.5) 30%, transparent 70%);
  --ds-glow-3: radial-gradient(ellipse at center, rgba(${c3}, 0.85) 0%, rgba(${c1}, 0.55) 40%, transparent 70%);
  --ds-whale-dot: rgba(150, 185, 230, 0.75);
  --ds-whale-opacity: 0.5;
  --ds-sel-bg: rgba(${c2}, 0.4);
  --ds-sel-color: #fff;
  --ds-toggle-bg: rgba(11, 17, 32, 0.65);
  --ds-toggle-border: rgba(74, 138, 196, 0.35);
  --ds-toggle-ico: #cbd5e1;
  /* UI 主题 token（深色，覆盖主题插件定义） */
  --dsw-alias-bg-base: ${cfg.base} !important;
  --dsw-alias-bg-layer-1: rgba(${c1}, 0.55) !important;
  --dsw-alias-bg-layer-2: rgba(${c2}, 0.18) !important;
  --dsw-alias-bg-layer-3: rgba(${c3}, 0.12) !important;
  --dsw-alias-label-primary: #e2e8f0 !important;
  --dsw-alias-label-secondary: #94a3b8 !important;
  --dsw-alias-label-tertiary: #64748b !important;
  --dsw-alias-border-l1: rgba(${c2}, 0.12) !important;
  --dsw-alias-border-l2: rgba(${c2}, 0.18) !important;
  --dsw-alias-accent-1: ${cfg.glow2} !important;
  --dsw-alias-accent-2: ${cfg.glow3} !important;
  --dsw-alias-mask: rgba(11, 17, 32, 0.36) !important;
}
html[data-ds-bg-mode="light"], html[data-ds-bg-mode="light"] body {
  color-scheme: light !important;
  --ds-base: ${LIGHT_PALETTE.base};
  --ds-text: ${LIGHT_PALETTE.text};
  --ds-grid: ${LIGHT_PALETTE.grid};
  --ds-glow-1: radial-gradient(circle, rgba(${l1}, 0.85) 0%, transparent 70%);
  --ds-glow-2: radial-gradient(circle, rgba(${l2}, 0.9) 0%, rgba(${l3}, 0.45) 30%, transparent 70%);
  --ds-glow-3: radial-gradient(ellipse at center, rgba(${l3}, 0.8) 0%, rgba(${l1}, 0.5) 40%, transparent 70%);
  --ds-whale-dot: ${LIGHT_PALETTE.whaleDot};
  --ds-whale-opacity: 0.35;
  --ds-sel-bg: rgba(${l3}, 0.3);
  --ds-sel-color: #0f172a;
  --ds-toggle-bg: rgba(255, 255, 255, 0.78);
  --ds-toggle-border: rgba(45, 92, 158, 0.25);
  --ds-toggle-ico: #33507a;
  /* UI 主题 token（浅色） */
  --dsw-alias-bg-base: ${LIGHT_PALETTE.base} !important;
  --dsw-alias-bg-layer-1: rgba(${l1}, 0.45) !important;
  --dsw-alias-bg-layer-2: rgba(${l2}, 0.5) !important;
  --dsw-alias-bg-layer-3: rgba(${l3}, 0.3) !important;
  --dsw-alias-label-primary: #1e293b !important;
  --dsw-alias-label-secondary: #475569 !important;
  --dsw-alias-label-tertiary: #64748b !important;
  --dsw-alias-border-l1: rgba(30, 64, 120, 0.12) !important;
  --dsw-alias-border-l2: rgba(30, 64, 120, 0.18) !important;
  --dsw-alias-accent-1: #2d6cb4 !important;
  --dsw-alias-accent-2: #4a8ac4 !important;
  --dsw-alias-mask: rgba(255, 255, 255, 0.4) !important;
}

html, body {
  background: var(--ds-base) !important;
  color: var(--ds-text);
}

/* === UI 内容层降透明，让底层光晕能透出来 === */
#root, #root > div, .ds-app, .ds-app-shell, .ds-shell, main {
  background-color: transparent !important;
  background-image: none !important;
}

/* === 光晕装饰层 ===
   浮在所有 UI 内容之上（z-index 99998 < dialog/modal 的 1000+ 阈值），
   pointer-events: none 不影响交互，视觉上是"光晕作为最上层装饰"。 */
.dsh-ds-home-bg {
  position: fixed;
  inset: 0;
  z-index: 99998;
  pointer-events: none;
  overflow: hidden;
  contain: strict;
}
.dsh-ds-home-bg .ds-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(${cfg.blur}px);
  opacity: ${cfg.opacity};
  will-change: transform;
  /* 不在深色底用 mix-blend-mode screen，会让光晕变暗。直接显示。 */
}
.dsh-ds-home-bg .ds-glow-1 {
  top: -15%;
  left: -10%;
  width: 780px;
  height: 780px;
  background: var(--ds-glow-1);
}
.dsh-ds-home-bg .ds-glow-2 {
  top: -5%;
  right: -12%;
  width: 880px;
  height: 880px;
  background: var(--ds-glow-2);
}
.dsh-ds-home-bg .ds-glow-3 {
  bottom: -18%;
  left: 30%;
  width: 720px;
  height: 720px;
  background: var(--ds-glow-3);
}
${cfg.animation ? `
.dsh-ds-home-bg .ds-glow-1 { animation: ds-pulse 8s ease-in-out infinite; }
.dsh-ds-home-bg .ds-glow-2 { animation: ds-pulse 11s ease-in-out -2s infinite reverse; }
.dsh-ds-home-bg .ds-glow-3 { animation: ds-pulse 9s ease-in-out -4s infinite; }
@keyframes ds-pulse {
  0%, 100% { transform: scale(1) translate(0, 0); }
  50%      { transform: scale(1.08) translate(2%, -2%); }
}
` : ""}

/* === 网格线 === */
.dsh-ds-home-bg .ds-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--ds-grid) 1px, transparent 1px),
    linear-gradient(90deg, var(--ds-grid) 1px, transparent 1px);
  background-size: 44px 44px;
  /* 弱化边缘 mask 强度，让网格覆盖更大区域 */
  mask-image: radial-gradient(ellipse 90% 90% at center, black 50%, transparent 100%);
  -webkit-mask-image: radial-gradient(ellipse 90% 90% at center, black 50%, transparent 100%);
  opacity: 0.85;
}

/* === 让 UI 内容层（在光晕之下） */
#root, main, .ds-app, .ds-app-shell, .ds-shell {
  position: relative;
  z-index: 0;
}

/* === 强制 UI 卡片/容器走深色半透明，让光晕透出可见 ===
   仅深色模式生效（body[data-ds-dark-theme] 只在 dark 下存在）。
   仅作用于非顶层容器，避免影响模态/抽屉等需要保持可读性的层。 */
body[data-ds-dark-theme] [class*="bg-white"]:not([role="dialog"] *):not([role="alertdialog"] *),
body[data-ds-dark-theme] [class*="bg-gray-5"]:not([role="dialog"] *),
body[data-ds-dark-theme] [class*="bg-gray-10"]:not([role="dialog"] *),
body[data-ds-dark-theme] [class*="bg-gray-50"]:not([role="dialog"] *),
body[data-ds-dark-theme] [class*="bg-neutral-"]:not([role="dialog"] *) {
  background-color: rgba(11, 17, 32, 0.72) !important;
  background-image: none !important;
  color: #e2e8f0 !important;
}
body[data-ds-dark-theme] [class*="text-gray-9"]:not([role="dialog"] *),
body[data-ds-dark-theme] [class*="text-gray-10"]:not([role="dialog"] *),
body[data-ds-dark-theme] [class*="text-gray-11"]:not([role="dialog"] *) {
  color: #cbd5e1 !important;
}

/* === [v2 修复] 顶层 UI 容器统一深色玻璃感背景 ===
   解决 sidebar 内部 panel / 对话区 / 状态栏仍是浅色的问题。 */
[data-ds-dark-theme] aside,
[data-ds-dark-theme] [class*="sidebar"]:not([class*="-sidebar-icon"]),
[data-ds-dark-theme] [class*="Sidebar"],
[data-ds-dark-theme] [class*="panel-"]:not([role="dialog"]),
[data-ds-dark-theme] [class*="Panel"]:not([role="dialog"]),
[data-ds-dark-theme] [class*="chat-"]:not([role="dialog"]),
[data-ds-dark-theme] [class*="Chat"]:not([role="dialog"]),
[data-ds-dark-theme] [role="complementary"],
[data-ds-dark-theme] [role="navigation"] {
  background-color: rgba(11, 17, 32, 0.82) !important;
  background-image: none !important;
  color: #e2e8f0 !important;
  border-color: rgba(74, 138, 196, 0.18) !important;
}
/* Sidebar 内部嵌套卡片式 panel（递归一层） */
[data-ds-dark-theme] aside [class*="bg-"],
[data-ds-dark-theme] [role="complementary"] [class*="bg-"],
[data-ds-dark-theme] [class*="sidebar"] [class*="bg-"] {
  background-color: rgba(20, 32, 60, 0.72) !important;
  background-image: none !important;
}

/* === [v2 修复] 强制所有 UI 文字浅色，覆盖硬编码 text-gray-500/400 等 ===
   排除：链接 a、按钮内 icon、主品牌色、错误/警告（红/绿/黄）、SVG、
   以及自带浅色底的高亮徽章（如"当前使用"inUse——浅底必须配深字/亮字，见下方专属规则）。 */
[data-ds-dark-theme] *:not(a):not(button):not([class*="text-red"]):not([class*="text-green"]):not([class*="text-yellow"]):not([class*="text-blue-400"]):not([class*="text-blue-500"]):not([class*="text-brand"]):not([class*="inUse"]):not(svg):not(svg *) {
  color: #cbd5e1 !important;
}
/* 高亮徽章（"当前使用"等 inUse 类）：UI 原生浅灰白底 rgb(226,232,240)，改品牌蓝半透明底 + 亮字 */
[data-ds-dark-theme] [class*="inUse"]:not(svg):not(svg *):not(button):not(a) {
  background-color: rgba(74, 138, 196, 0.45) !important;
  background-image: none !important;
  color: #f1f5f9 !important;
  -webkit-text-fill-color: #f1f5f9 !important;
  border-color: rgba(74, 138, 196, 0.5) !important;
}
[data-ds-dark-theme] h1:not([class*="text-red"]):not([class*="text-green"]),
[data-ds-dark-theme] h2:not([class*="text-red"]):not([class*="text-green"]),
[data-ds-dark-theme] h3:not([class*="text-red"]):not([class*="text-green"]),
[data-ds-dark-theme] h4:not([class*="text-red"]):not([class*="text-green"]),
[data-ds-dark-theme] strong {
  color: #f1f5f9 !important;
}
/* 输入框文字 + placeholder（防 autofill 改色） */
[data-ds-dark-theme] input,
[data-ds-dark-theme] textarea,
[data-ds-dark-theme] [contenteditable="true"] {
  color: #f1f5f9 !important;
  -webkit-text-fill-color: #f1f5f9 !important;
}
[data-ds-dark-theme] ::placeholder,
[data-ds-dark-theme] input::placeholder,
[data-ds-dark-theme] textarea::placeholder {
  color: #64748b !important;
  opacity: 1 !important;
}

/* === 对话气泡 / 设置对话框 单独加固（更亮一些，便于阅读） === */
[data-ds-dark-theme] [class*="bubble"]:not([role="dialog"] *),
[data-ds-dark-theme] [class*="Bubble"]:not([role="dialog"] *),
[data-ds-dark-theme] [class*="message"]:not([role="dialog"] *),
[data-ds-dark-theme] [class*="Message"]:not([role="dialog"] *),
[data-ds-dark-theme] [role="dialog"],
[data-ds-dark-theme] [role="alertdialog"] {
  background-color: rgba(20, 32, 60, 0.92) !important;
  color: #e2e8f0 !important;
  border-color: rgba(74, 138, 196, 0.22) !important;
}

/* === popup menu 浮层实底（v7.6.2 修复「视图选项」半透明）
   dsh 默认 menu portal 容器背景是 rgba(143,184,232,0.3) 玻璃质感，深色系统下
   几乎透光、菜单文字与下方工作区项互相干扰。沿用 dialog 实底色 + 加边框提升层次。
   选择器用 [data-ds-bg-mode]（plugin 内部状态）保证关闭皮肤时让位 dsh 原生玻璃。 */
[data-ds-bg-mode="dark"] [role="menu"][class*="_portal_"] {
  background-color: rgba(20, 32, 60, 1) !important;
  background-image: none !important;
  color: #e2e8f0 !important;
  border: 1px solid rgba(74, 138, 196, 0.25) !important;
  backdrop-filter: blur(8px) !important;
}
[data-ds-bg-mode="light"] [role="menu"][class*="_portal_"] {
  background-color: rgba(249, 251, 254, 1) !important;
  background-image: none !important;
  color: #1e293b !important;
  border: 1px solid rgba(30, 41, 59, 0.08) !important;
  backdrop-filter: blur(8px) !important;
}

/* === 状态栏 / 顶栏 单独加固（仅作用于顶层 UI，不作用于 dialog 内部，避免面板顶栏"变盖子"） === */
[data-ds-dark-theme] [class*="status"]:not([role="dialog"] *):not([role="alertdialog"] *),
[data-ds-dark-theme] [class*="Status"]:not([role="dialog"] *):not([role="alertdialog"] *),
[data-ds-dark-theme] [class*="footer"]:not([class*="-footer-icon"]):not([role="dialog"] *):not([role="alertdialog"] *),
[data-ds-dark-theme] [class*="Footer"]:not([role="dialog"] *):not([role="alertdialog"] *),
[data-ds-dark-theme] [class*="header"]:not([class*="-header-icon"]):not([role="dialog"] *):not([role="alertdialog"] *),
[data-ds-dark-theme] [class*="Header"]:not([role="dialog"] *):not([role="alertdialog"] *) {
  background-color: rgba(8, 14, 28, 0.85) !important;
  background-image: none !important;
  color: #cbd5e1 !important;
  border-color: rgba(74, 138, 196, 0.12) !important;
}

/* === Dialog/alertdialog 整体及其子元素统一背景，避免面板内出现"暗盖子" ===
   让 dialog 内部所有 div/section 继承 dialog 自身颜色，不被 header/footer 规则二次覆盖。 */
[data-ds-dark-theme] [role="dialog"] [class*="header"]:not([class*="-header-icon"]),
[data-ds-dark-theme] [role="dialog"] [class*="Header"],
[data-ds-dark-theme] [role="dialog"] [class*="footer"]:not([class*="-footer-icon"]),
[data-ds-dark-theme] [role="dialog"] [class*="Footer"],
[data-ds-dark-theme] [role="dialog"] [class*="title"]:not([class*="-title-icon"]),
[data-ds-dark-theme] [role="dialog"] [class*="Title"],
[data-ds-dark-theme] [role="dialog"] [class*="bar"]:not([class*="-bar-icon"]),
[data-ds-dark-theme] [role="dialog"] [class*="Bar"],
[data-ds-dark-theme] [role="dialog"] > div,
[data-ds-dark-theme] [role="dialog"] > header,
[data-ds-dark-theme] [role="dialog"] > footer,
[data-ds-dark-theme] [role="alertdialog"] [class*="header"]:not([class*="-header-icon"]),
[data-ds-dark-theme] [role="alertdialog"] [class*="Header"],
[data-ds-dark-theme] [role="alertdialog"] [class*="footer"]:not([class*="-footer-icon"]),
[data-ds-dark-theme] [role="alertdialog"] [class*="Footer"],
[data-ds-dark-theme] [role="alertdialog"] [class*="title"]:not([class*="-title-icon"]),
[data-ds-dark-theme] [role="alertdialog"] [class*="Title"],
[data-ds-dark-theme] [role="alertdialog"] [class*="bar"]:not([class*="-bar-icon"]),
[data-ds-dark-theme] [role="alertdialog"] [class*="Bar"],
[data-ds-dark-theme] [role="alertdialog"] > div,
[data-ds-dark-theme] [role="alertdialog"] > header,
[data-ds-dark-theme] [role="alertdialog"] > footer {
  background-color: transparent !important;
  background-image: none !important;
  color: inherit !important;
  border-color: transparent !important;
}

/* === [v6] 弹层抬到装饰层之上 + 浅色模式 dialog 实底化 ===
   #root 是 relative + z-index:0，整个 app（含所有弹层）被困在这个低于装饰层(99998)
   的 stacking context 里——先放开 #root，再把弹层容器抬到装饰层之上。
   （UI 弹层原生 z-index 只有 1000~1100，且 dialog 在 <div class="xxx_overlay"> 内） */
#root {
  z-index: auto !important;
}
[class*="_overlay"],
[class*="_Overlay"],
[class*="_popover"],
[class*="_Popover"],
[role="dialog"],
[role="alertdialog"],
[role="listbox"],
[role="menu"] {
  z-index: 100000 !important;
}
[data-ds-bg-mode="light"] [role="dialog"],
[data-ds-bg-mode="light"] [role="alertdialog"] {
  background-color: rgba(249, 251, 254, 0.99) !important;
  background-image: none !important;
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
  color: #1e293b !important;
  border-color: rgba(45, 95, 158, 0.16) !important;
}
/* dialog 直接子元素的毛玻璃在实底上只会发灰，一并去掉 */
[data-ds-bg-mode="light"] [role="dialog"] > div,
[data-ds-bg-mode="light"] [role="alertdialog"] > div {
  backdrop-filter: none !important;
  -webkit-backdrop-filter: none !important;
}

/* === [v6.2] 反色组件文字修复（浅色 + 深色）===
   UI 的反色组件（inUse 徽章 / brokenBadge / iconButton 悬停提示 / save 保存按钮）
   都是「底(=label-primary) + 文字(=bg-layer-3)」。我们把 bg-layer-3 改成了半透明
   （浅色 rgba(l3,0.3) / 深色 rgba(c3,0.12)，供卡片透光）→ 反色组件文字变透明看不清。
   修法：给这些组件强制实色文字。注意反色方向随模式翻转：
   浅色模式 = 深底(label-primary=#1e293b) → 白字；深色模式 = 浅底(#e2e8f0) → 深字。 */
[data-ds-bg-mode="light"] [class*="_inUse"]:not(svg):not(svg *):not(button):not(a),
[data-ds-bg-mode="light"] [class*="_brokenBadge"]:not(svg):not(svg *):not(button):not(a),
[data-ds-bg-mode="light"] [class*="_iconButton"]:after,
[data-ds-bg-mode="light"] [class*="_save"]:not([class*="savedNotice"]):not(svg):not(svg *) {
  color: #eef3fa !important;
  -webkit-text-fill-color: #eef3fa !important;
}
[data-ds-bg-mode="dark"] [class*="_iconButton"]:after,
[data-ds-bg-mode="dark"] [class*="_save"]:not([class*="savedNotice"]):not(svg):not(svg *) {
  color: #0b1120 !important;
  -webkit-text-fill-color: #0b1120 !important;
}
[data-ds-bg-mode="dark"] [class*="_brokenBadge"]:not(svg):not(svg *):not(button):not(a) {
  color: #ffffff !important;
  -webkit-text-fill-color: #ffffff !important;
}

/* === 滚动条/选中态（随模式变色） === */
::selection { background: var(--ds-sel-bg); color: var(--ds-sel-color); }
::-webkit-scrollbar-track { background: var(--ds-base); }

/* === 点阵鲸鱼（官网 hero 同款）===
   SVG pattern 方点填充鲸鱼轮廓，径向 mask 让边缘淡出，呈"藏在光晕里"的效果。
   点的颜色/透明度经 --ds-whale-dot / --ds-whale-opacity 随模式切换。 */
.dsh-ds-home-bg .ds-whale {
  position: absolute;
  top: 1%;
  right: -1%;
  width: 50vw;
  height: auto;
  opacity: var(--ds-whale-opacity);
  transform: rotate(-16deg);
  transform-origin: center;
  -webkit-mask-image: radial-gradient(ellipse 62% 66% at 56% 44%, black 38%, transparent 94%);
  mask-image: radial-gradient(ellipse 62% 66% at 56% 44%, black 38%, transparent 94%);
  ${cfg.animation ? "animation: ds-whale-float 16s ease-in-out infinite;" : ""}
}
.dsh-ds-home-bg .ds-whale-dot {
  fill: var(--ds-whale-dot);
}
@keyframes ds-whale-float {
  0%, 100% { transform: rotate(-16deg) translate(0, 0); }
  50%      { transform: rotate(-13.5deg) translate(-1.2%, 1.6%); }
}

/* === [v7] 主入口已迁到设置面板「外观」分组 ===
   整体启用状态由 html[data-ds-bg-disabled] 控制——存在即关闭装饰层。
   旧的右下角悬浮按钮 DOM/JS/CSS 已彻底移除（v7 之前保留是临时调试）。 */
html[data-ds-bg-disabled] .dsh-ds-home-bg { display: none !important; }

/* 皮肤开关行（在「外观」分组末尾追加的 group 里） */
.ds-bg-skin-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 0 4px;
}
.ds-bg-skin-row .ds-bg-skin-label {
  font-size: 14px;
  color: var(--ds-skin-row-label, #cbd5e1);
}
.ds-bg-switch {
  position: relative;
  width: 38px;
  height: 22px;
  border-radius: 11px;
  background: rgba(148, 163, 184, 0.35);
  border: none;
  cursor: pointer;
  padding: 0;
  transition: background 0.2s ease;
  flex-shrink: 0;
}
.ds-bg-switch::after {
  content: "";
  position: absolute;
  top: 3px;
  left: 3px;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #f1f5f9;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
}
.ds-bg-switch[aria-checked="true"] {
  background: #4a8ac4;
}
.ds-bg-switch[aria-checked="true"]::after {
  transform: translateX(16px);
}
.ds-bg-switch:focus-visible {
  outline: 2px solid #4a8ac4;
  outline-offset: 2px;
}
`;
}

// 早于 React mount：按系统外观偏好（syspref 镜像 + matchMedia）解析深浅，
// 设置 data-ds-bg-mode="dark"|"light"（深色时附 data-ds-dark-theme 供 CSS 使用），
// 并用 MutationObserver 防止被其他主题插件清掉。
// [v7.6] 皮肤无独立模式，恒跟随系统「外观」；settings script 点击系统 cube 时
// 在 capture 阶段先镜像 syspref 并派发 ds-bg-syspref，boot 据此重新 apply。
function buildBootScript() {
  return `(() => {
  try {
    var EN_KEY = 'dsh-ds-home-bg-enabled'; // 'true' | 'false'（字符串方便 storage 事件传递）
    var SYSPREF_KEY = 'dsh-ds-home-bg-syspref'; // 系统外观偏好镜像 'light'|'dark'|'system'
    var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
    var lock = false;
    // [v7.6] 清理旧版「皮肤主题」独立模式的 localStorage 残留（不再使用）
    try { localStorage.removeItem('dsh-ds-home-bg-mode'); } catch (e) {}

    var savedEnabled = function () {
      var v = null;
      try { v = localStorage.getItem(EN_KEY); } catch (e) {}
      // 缺省视为启用（首次安装行为）
      return v === 'false' ? false : true;
    };

    // 系统主题当前应解析的深浅。宿主 ThemePresenter 只在 theme/change 时写
    // body[data-ds-dark-theme]、没有 DOM 守卫——皮肤启用期间我们写过的属性，关闭时
    // 必须由我们按系统意图让位，否则系统浅色会卡在深色（反之亦然）。
    // 系统偏好由设置面板脚本镜像到 SYSPREF_KEY（读系统 cube 选中态）。
    var hostWantsDark = function () {
      var pref = null;
      try { pref = localStorage.getItem(SYSPREF_KEY); } catch (e) {}
      if (pref !== 'light' && pref !== 'dark') pref = 'system';
      if (pref === 'system') return !!(mq && mq.matches);
      return pref === 'dark';
    };

    // [v7.6] 皮肤色板恒跟随系统当前深浅：系统浅色→浅海、深色→深海、跟随系统→matchMedia。
    var resolved = function () {
      return hostWantsDark() ? 'dark' : 'light';
    };

    var apply = function () {
      if (lock) return;
      lock = true;
      try {
        var r = resolved();
        var en = savedEnabled();
        var de = document.documentElement;
        var deBody = document.body;
        if (en) {
          // [v7.3] 启用：写入所有主题属性 + body 镜像，CSS 变量覆写规则生效
          de.setAttribute('data-ds-bg-mode', r);
          de.removeAttribute('data-ds-bg-auto'); // [v7.6] 清理旧版独立模式标记残留
          de.removeAttribute('data-ds-bg-disabled');
          de.style.colorScheme = r;
          if (r === 'dark') de.setAttribute('data-ds-dark-theme', '');
          else de.removeAttribute('data-ds-dark-theme');
          if (deBody) {
            deBody.setAttribute('data-ds-bg-mode', r);
            if (r === 'dark') deBody.setAttribute('data-ds-dark-theme', '');
            else deBody.removeAttribute('data-ds-dark-theme');
          }
        } else {
          // [v7.5] 关闭：清皮肤自写属性；data-ds-dark-theme 按系统当前意图让位。
          // 宿主 presenter 不会主动重写它，残留会让系统主题卡在皮肤最后的状态。
          var sysDark = hostWantsDark();
          de.setAttribute('data-ds-bg-disabled', '');
          de.removeAttribute('data-ds-bg-mode');
          de.removeAttribute('data-ds-bg-auto');
          de.style.colorScheme = sysDark ? 'dark' : 'light';
          if (sysDark) de.setAttribute('data-ds-dark-theme', '');
          else de.removeAttribute('data-ds-dark-theme');
          if (deBody) {
            deBody.removeAttribute('data-ds-bg-mode');
            if (sysDark) deBody.setAttribute('data-ds-dark-theme', '');
            else deBody.removeAttribute('data-ds-dark-theme');
          }
        }
        // 通知设置面板控件同步视觉（如果已挂载）
        try { window.dispatchEvent(new CustomEvent('ds-bg-state', { detail: { resolved: r, enabled: en } })); } catch (e) {}
      } finally { lock = false; }
    };
    apply();

    // [v7.6] 皮肤恒跟随系统：任何系统深浅变化（含跟随系统下的 OS 切换）都重新 apply
    var onSys = function () { if (savedEnabled()) apply(); };
    if (mq) {
      try { mq.addEventListener('change', onSys); } catch (e) { try { mq.addListener(onSys); } catch (e2) {} }
    }

    // 主题插件可能后续 toggleAttribute 把属性清掉/改掉，我们持续守（html + body 双端）。
    var mo = new MutationObserver(function () {
      if (lock) return;
      var r = resolved();
      var en = savedEnabled();
      var de = document.documentElement;
      var deBody = document.body;
      var need;
      if (en) {
        need = de.getAttribute('data-ds-bg-mode') !== r
          || de.hasAttribute('data-ds-bg-auto') // [v7.6] 旧版标记残留（正常应为空）
          || (r === 'dark' ? !de.hasAttribute('data-ds-dark-theme') : de.hasAttribute('data-ds-dark-theme'))
          || (deBody && deBody.getAttribute('data-ds-bg-mode') !== r)
          // [v7.5] body 端深色钥匙也要守——宿主 presenter 在 theme/change 时可能改写它。
          // [v7.6] 皮肤恒跟随系统，capture 镜像先于 React 提交更新 syspref，故此处纠正
          // 方向与系统新意图一致，不会打架。
          || (deBody && (r === 'dark' ? !deBody.hasAttribute('data-ds-dark-theme') : deBody.hasAttribute('data-ds-dark-theme')));
      } else {
        // [v7.4] 关闭时只看我们自己的标记残留。data-ds-dark-theme 是系统的，
        // 系统自己点「深色」时会设上 body — 我们别去管它，否则会和系统互相打架。
        need = de.hasAttribute('data-ds-bg-mode')
          || de.hasAttribute('data-ds-bg-auto')
          || (deBody && deBody.hasAttribute('data-ds-bg-mode'));
      }
      need = need || (en ? de.hasAttribute('data-ds-bg-disabled') : !de.hasAttribute('data-ds-bg-disabled'));
      if (need) apply();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-ds-bg-mode', 'data-ds-dark-theme', 'data-ds-bg-disabled', 'data-theme'] });
    if (document.body) {
      mo.observe(document.body, { attributes: true, attributeFilter: ['data-ds-bg-mode', 'data-ds-dark-theme', 'data-theme'] });
    }

    // [v7.6] settings script 在系统「外观」cube 被点击（capture，先于 React 提交）时
    // 镜像系统偏好并派发此事件；这里监听并立即 apply，让 html 端皮肤钥匙与系统新意图一致
    //（皮肤启用 / 让位两条路径都需要）。
    window.addEventListener('ds-bg-syspref', function () { apply(); });

    // 暴露给设置面板控件调用的 API（v7.6 起仅开关——主题模式由系统「外观」全权决定）
    window.__dsBgSettings = {
      getEnabled: function () { return savedEnabled(); },
      setEnabled: function (v) {
        try { localStorage.setItem(EN_KEY, v ? 'true' : 'false'); } catch (e) {}
        apply();
      }
    };

    // 多 tab 同步：别的 tab 改了 storage 立即跟随
    window.addEventListener('storage', function (e) {
      if (!e || !e.key) return;
      if (e.key === EN_KEY || e.key === SYSPREF_KEY) apply();
    });
  } catch (e) {}
})();`;
}

// 点阵鲸鱼 SVG：官网 hero-whale.svg 的 path + 方点 pattern 填充（halftone 效果）
function buildWhaleSvg() {
  return (
    '<svg class="ds-whale" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">'
    + '<defs><pattern id="dsWhaleDots" width="0.56" height="0.56" patternUnits="userSpaceOnUse">'
    + '<rect class="ds-whale-dot" x="0.15" y="0.15" width="0.26" height="0.26"/>'
    + '</pattern></defs>'
    + '<path d="' + WHALE_PATH + '" fill="url(#dsWhaleDots)"/>'
    + "</svg>"
  );
}

// [v7.6] 设置面板集成：系统「外观」分组保持原样（浅/深/跟随系统三选一始终可见可点，
// 皮肤配色自动跟随它），仅在其后紧跟「背景皮肤」开关 group。锚点：第一个含
// _8HJdBW_themeCube 的 _8HJdBW_group。同时镜像系统外观偏好（读系统 cube 选中态）
// 到 localStorage('dsh-ds-home-bg-syspref')：系统 cube 被点击时在 capture 阶段
//（先于 React 提交）同步镜像并派发 ds-bg-syspref，让 boot 守卫读到最新系统意图后
// 再 apply——避免皮肤与系统两把深浅钥匙打架。
function buildSettingsScript() {
  return `(() => {
  try {
    var ANCHOR_CLS = '_8HJdBW_group';
    var SYSPREF_KEY = 'dsh-ds-home-bg-syspref';

    var findAnchorGroup = function (root) {
      // 第一个含 _8HJdBW_themeCube 按钮的 _8HJdBW_group（=外观分组）
      var groups = root.querySelectorAll('[class*="' + ANCHOR_CLS + '"]');
      for (var i = 0; i < groups.length; i++) {
        if (groups[i].querySelector('[class*="_themeCube"]')) return groups[i];
      }
      return null;
    };

    var renderToggle = function (enabled) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'ds-bg-switch';
      btn.setAttribute('role', 'switch');
      btn.setAttribute('aria-checked', enabled ? 'true' : 'false');
      btn.setAttribute('aria-label', '启用背景皮肤');
      btn.title = '启用/关闭背景皮肤装饰';
      return btn;
    };

    // 系统「外观」cube 的 DOM 顺序 = light, dark, system（宿主 AppearanceRow 常量顺序）
    var CUBE_PREFS = ['light', 'dark', 'system'];

    var currentAnchor = null; // 「外观」分组（第一个含 _themeCube 的 _group）当前引用
    var lastPref = null;      // 上次镜像的系统偏好，用于去重派发 ds-bg-syspref

    // [v7.6] 镜像系统外观偏好（读系统 cube 选中态）到 localStorage(SYSPREF_KEY)。
    // boot script 依据它决定皮肤深浅（启用写钥匙 / 关闭让位都靠它）。
    // 偏好变化才派发 ds-bg-syspref，避免无意义重复 apply。
    var recordSysPref = function () {
      if (!currentAnchor || !currentAnchor.isConnected) return;
      var cubes = currentAnchor.querySelectorAll('[class*="_themeCube"]');
      var pref = null;
      for (var i = 0; i < cubes.length && i < CUBE_PREFS.length; i++) {
        var sel = cubes[i].className.indexOf('_selected') >= 0
          || cubes[i].getAttribute('aria-pressed') === 'true';
        if (sel) { pref = CUBE_PREFS[i]; break; }
      }
      if (!pref) return;
      try { localStorage.setItem(SYSPREF_KEY, pref); } catch (e) {}
      if (pref !== lastPref) {
        lastPref = pref;
        try { window.dispatchEvent(new CustomEvent('ds-bg-syspref', { detail: { pref: pref } })); } catch (e) {}
      }
    };

    var sync = function () {
      var api = window.__dsBgSettings;
      if (!api) return;
      var gA = document.querySelector('[data-ds-bg-skin-root]');
      if (!gA) return;
      var sw = gA.querySelector('.ds-bg-switch');
      if (sw) sw.setAttribute('aria-checked', api.getEnabled() ? 'true' : 'false');
    };

    var inject = function (dialog) {
      // [v7.2] 先捕获锚点（即使注入内容还在也要刷新 currentAnchor——
      // React 重渲染可能替换外观分组节点，旧引用断开后镜像会失效）
      var anchor = findAnchorGroup(dialog);
      if (anchor) currentAnchor = anchor;
      else if (currentAnchor && !currentAnchor.isConnected) currentAnchor = null;
      if (!anchor) return; // 不是「通用设置」的 dialog（可能打开了别的设置）
      var api = window.__dsBgSettings;
      if (!api) return;

      // 「背景皮肤」开关 group：紧跟「外观」分组之后
      if (!dialog.querySelector('[data-ds-bg-skin-root]')) {
        var gA = document.createElement('div');
        gA.className = ANCHOR_CLS;
        gA.setAttribute('data-ds-bg-skin-root', '');
        var titleA = document.createElement('div');
        titleA.className = '_8HJdBW_title';
        titleA.textContent = '背景皮肤';
        var row = document.createElement('div');
        row.className = 'ds-bg-skin-row';
        var label = document.createElement('span');
        label.className = 'ds-bg-skin-label';
        label.textContent = '启用装饰背景';
        row.appendChild(label);
        row.appendChild(renderToggle(api.getEnabled()));
        gA.appendChild(titleA);
        gA.appendChild(row);
        anchor.parentNode.insertBefore(gA, anchor.nextSibling);
      }
      recordSysPref();
    };

    // 事件委托（capture）：① 系统「外观」cube 点击 → 在 capture 阶段（先于 React 提交）
    // 同步镜像偏好并派发 ds-bg-syspref——保证 boot 守卫随后 apply 时读到的是新系统意图，
    // 不会误纠宿主刚写下的 data-ds-dark-theme；② 「背景皮肤」开关。
    document.addEventListener('click', function (e) {
      var t = e.target;
      var cube = t && t.closest ? t.closest('[class*="_themeCube"]') : null;
      if (cube && currentAnchor && currentAnchor.isConnected && currentAnchor.contains(cube)) {
        var row = cube.parentNode;
        var all = row ? row.querySelectorAll('[class*="_themeCube"]') : [];
        var idx = -1;
        for (var i = 0; i < all.length; i++) { if (all[i] === cube) { idx = i; break; } }
        if (idx >= 0 && idx < CUBE_PREFS.length) {
          var pref = CUBE_PREFS[idx];
          try { localStorage.setItem(SYSPREF_KEY, pref); } catch (e2) {}
          lastPref = pref;
          try { window.dispatchEvent(new CustomEvent('ds-bg-syspref', { detail: { pref: pref } })); } catch (e2) {}
        }
        return; // 不拦截默认行为——选中态由系统自己处理
      }
      var sw = t && t.closest ? t.closest('.ds-bg-switch') : null;
      if (sw) {
        var api = window.__dsBgSettings;
        if (api) api.setEnabled(!api.getEnabled());
        e.preventDefault();
      }
    }, true);

    // boot script 会派发 ds-bg-state 事件；监听以同步视觉
    window.addEventListener('ds-bg-state', sync);

    // [v7.2] 监听 DOM 变化。不能只盯「dialog 新增」：设置面板内切 tab（通用设置 → 模型 → 回来）
    // 时 React 复用同一个 [role=dialog]，只替换内部子树——注入的内容随旧子树被卸载，
    // 却没有 dialog 新增事件。改为：任何子树变化 → 防抖扫描所有 dialog，发现锚点未注入就补。
    var check = function () {
      var dialogs = document.querySelectorAll('[role="dialog"]');
      for (var i = 0; i < dialogs.length; i++) {
        inject(dialogs[i]);
      }
      recordSysPref();
      sync();
    };
    var pending = false;
    var scheduleCheck = function () {
      if (pending) return;
      pending = true;
      setTimeout(function () {
        pending = false;
        try { check(); } catch (e) {}
      }, 0);
    };
    var mo = new MutationObserver(function (muts) {
      for (var i = 0; i < muts.length; i++) {
        if (muts[i].addedNodes && muts[i].addedNodes.length) { scheduleCheck(); return; }
      }
    });
    var start = function () {
      mo.observe(document.body || document.documentElement, { childList: true, subtree: true });
      // 已存在的 dialog 也补一次
      check();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
    else start();
  } catch (e) {}
})();`;
}

export function apply(ctx) {
  // 用户可在 ~/.dsh/profiles/<name>/config.yaml 里覆盖：
  //   plugins:
  //     dsh-ds-home-bg:
  //       base: "#0B1120"
  //       opacity: 0.7
  //       animation: false
  // 配置在 webserver 事件触发时已就绪，可安全读取。
  let userCfg = {};
  try {
    userCfg = ctx.get?.("config")?.["dsh-ds-home-bg"] || {};
  } catch {
    /* 早期注入阶段 config 尚未注册——使用默认值 */
  }
  const cfg = { ...DEFAULTS, ...userCfg };

  ctx.on("webserver/index-inject", (table) => {
    // 1) head 末尾的 style：主题变量 + 光晕样式
    table.push({ kind: "style", text: buildCss(cfg) });
    // 2) head 末尾的 boot script：尽早开启暗色主题 + 持续守防
    table.push({ kind: "script", placement: "body", text: buildBootScript() });
    // 2.5) 设置面板注入脚本：外观组后注入「背景皮肤」开关 + 镜像系统外观偏好
    table.push({ kind: "script", placement: "body", text: buildSettingsScript() });
    // 3) head 末尾的 html：光晕装饰层（kind: "html" 用 row.html 字段）+ 点阵鲸鱼
    table.push({
      kind: "html",
      html:
        '<div class="dsh-ds-home-bg" aria-hidden="true">'
        + '<div class="ds-glow ds-glow-1"></div>'
        + '<div class="ds-glow ds-glow-2"></div>'
        + '<div class="ds-glow ds-glow-3"></div>'
        + '<div class="ds-grid"></div>'
        + buildWhaleSvg()
        + "</div>",
    });
  });
}
