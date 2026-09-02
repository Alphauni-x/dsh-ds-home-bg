# dsh-ds-home-bg

> DeepSeek Harness **背景主题插件**：把 Web UI 背景替换为 [deepseek.com/harness](https://www.deepseek.com/harness/) 官网同款——深蓝黑底色 + 蓝色径向光晕 + 细网格线 + 点阵鲸鱼。**配色自动跟随系统「外观」**（深色 / 浅色），零设置冲突。

## 效果

### 深色系统（夜晚）

- **底色**：`#0B1120` 深蓝黑
- **三层光晕**：左 `#1A3870`、中 `#4A8AC4`→`#2D5F9E`、右 `#2D5F9E`→`#1A3870`，缓慢呼吸动画
- **细网格**：44px × 44px，淡蓝色 (`rgba(74,138,196,0.06)`)，中心 90% 区域可见
- **点阵鲸鱼**：官网 hero 同款半调方点鲸鱼，藏在右上光晕里缓缓漂浮

### 浅色系统（白天）

- **底色**：`#EEF3FA` 浅蓝白，UI 回归原生浅色面板
- **柔和光晕**：`#A9C8F0` / `#D7E6F9` / `#8FB8E8`
- **点阵鲸鱼**：深蓝色点阵，若隐若现

### 设置面板

皮肤开关位于 **设置 → 通用设置**，「背景皮肤」分组紧跟系统「外观」分组之后：

- **配色恒跟随系统外观**：你在系统「外观」组选「深色」，背景就是深海风格；选「浅色」就是浅海风格；选「跟随系统」则随 `prefers-color-scheme` 实时切换。皮肤没有任何独立主题选择——不会与系统主题打架。
- **「背景皮肤」开关**：关闭后整套装饰（光晕 / 网格 / 鲸鱼）隐藏，页面恢复 dsh 原生背景；重新打开立即恢复。

选择持久化在浏览器 `localStorage`：

| Key | 值 | 说明 |
|-----|---|------|
| `dsh-ds-home-bg-enabled` | `'true'` / `'false'` | 皮肤总开关 |
| `dsh-ds-home-bg-syspref` | `'light'` / `'dark'` / `'system'` | 系统「外观」偏好镜像（插件内部同步用，关闭皮肤时按它让位系统主题） |
| `dsh-ds-home-bg-mode` | 已废弃 | 旧版皮肤模式 key；v7.6 起启动时自动清理残留 |

### 细节

- **动画**：三层光晕不同周期（8s / 11s / 9s）缓慢呼吸，鲸鱼 16s 漂浮
- **交互**：光晕层 `pointer-events: none` + `z-index: 99998`，永不挡 UI 操作；设置面板等弹层浮在装饰层之上（v6 层级修复）
- **弹层实底**：dialog 不透明（深色 `rgba(20,32,60,0.92)` / 浅色 `rgba(249,251,254,0.99)`），不透出底层内容
- **popup menu 实底**（v7.6.3，覆盖所有 `[role="menu"]` 浮层）：dsh 默认给所有 dropdown / popup / dropdown menu 容器设的是 `rgba(143,184,232,0.3)` 玻璃质感，深色系统下菜单文字会透出底层内容、互相干扰。插件改为完全不透明（深色 `rgba(20,32,60,1)` / 浅色 `rgba(249,251,254,1)`）+ `backdrop-filter: blur(8px)`。覆盖面板：
  - 「视图选项」（首页工作区侧栏）`_list_…_denseList_…_scrollable_…_portal_…`
  - 「权限模式」（输入框上方）`_list_…_scrollable_…_sideTop_…`
  - 「模型选择」（输入框右侧）`_7KE1Ra_menu`

  这三个面板的 class hash 前缀互不相同，唯一共同点是 `role="menu"`，故选择器放宽到 `[data-ds-bg-mode="dark|light"] [role="menu"]`，一次覆盖所有同类浮层
- **AI 思考状态指示渐变扫光**（v7.6.4）：对话页面 AI 思考时（streaming）会显示状态文字（典型文案 "Deep diving..."，class 稳定后缀 `_turnStatus`）。dsh 原生为它设了 `-webkit-text-fill-color: transparent` + `background-clip: text` + `background-size: 250% 100%` + `animation` 扫光，但 keyframes 完全没设 `background-image`（stylesheet 显式 `background-image: ;` = `none`），导致文字永久透明不可见——这正是用户问"AI 思考时怎么不显示深度思考字样"的根因。插件用 `MutationObserver` 检测元素出现，通过 `el.style.setProperty(name, value, 'important')`（inline `!important`，最高优先级，能突破 animation context 对 stylesheet `!important` 的锁）注入蓝色品牌渐变文字 + 自定义扫光 keyframes（`@keyframes ds-bg-shimmer` 把 `background-position` 从 0% 50% 推到 -200% 50%）：
  - 深色：`#4a8ac4 → #7ab8e8 → #bcdaf6 → #4a8ac4 → #2d6cb4`
  - 浅色：`#2d6cb4 → #4a8ac4 → #1e5a9e → #2d6cb4 → #1e4e8a`

## 安装

### 方式 A：直接试用（推荐先看效果）

不修改任何 profile 配置，临时叠加到 Web UI：

```bash
# 默认端口 3080，加 --port 改端口
dsh --profile web --patch /path/to/dsh-ds-home-bg/test.patch.yml --no-open
```

`test.patch.yml` 只覆盖配色配置；插件本体通过下面的方式 B 注册到 profile 后 `--patch` 才会生效。

### 方式 B：正式安装到 profile

```bash
dsh plugin --profile web add /path/to/dsh-ds-home-bg
```

之后 `dsh --profile web` 启动就会自动应用，**无需再带 `--patch`**。

### 卸载

```bash
dsh plugin --profile web remove dsh-ds-home-bg
```

> **手动卸载**：删除 `~/.dsh/profiles/web/node_modules/dsh-ds-home-bg/` + `package.json` 中的依赖条目 + `cordis.patch.yml` 中的 `insert` 段，然后重启 `dsh web`。

## ⚠️ 修改代码后必须重启 web 实例

`webserver/index-inject` 只在启动时触发，**cordis HMR 不会重新注入 style**。改了 `index.js` 后必须重启 `dsh web`：

```bash
pkill -f "dsh web" && sleep 2 && dsh web
```

修改 `cordis.patch.yml` 里 `config:` 下的参数（颜色、模糊度等）则**支持热重载**，无需重启。

## 配置

在 `~/.dsh/profiles/web/cordis.patch.yml` 末尾追加：

```yaml
- id: ds-home-bg
  config:
    base: "#0B1120"     # 底色
    glow1: "#1A3870"    # 左下光晕
    glow2: "#4A8AC4"    # 中上光晕
    glow3: "#2D5F9E"    # 右下光晕
    grid: "rgba(74, 138, 196, 0.06)"  # 网格线
    blur: 140           # 光晕模糊半径 px
    opacity: 0.45       # 光晕整体强度
    animation: true     # 是否开启动画
```

改完保存后**热重载**生效——无需重启服务。

## 文件结构

```
dsh-ds-home-bg/
├── index.js            # 插件入口（ESM, 零外部依赖, 深/浅双主题 + 设置面板注入）
├── package.json        # bundle manifest（dsh.bundle 字段）
├── cordis.patch.yml    # bundle patch（`dsh plugin add` 时使用，按包名解析）
├── test.patch.yml      # --patch 快速试用时的配置层
└── README.md
```

## 实现要点

插件通过监听 `webserver/index-inject` 事件向 `index.html` 注入四段内容：

| kind | 位置 | 字段 | 作用 |
|------|------|------|------|
| `style` | head 末尾 | `text` | 深浅两套 CSS 变量色板 + 装饰层样式 + 设置面板开关样式 |
| `script` (boot) | body 末尾 | `text` | 解析宿主系统主题意图、守护 `data-ds-dark-theme`、暴露 `window.__dsBgSettings`、监听 `ds-bg-syspref` 事件 |
| `script` (settings) | body 末尾 | `text` | 设置面板注入「背景皮肤」开关组；capture 阶段镜像系统外观偏好 |
| `html` | body 末尾 | `html` | 光晕装饰层 `<div>` + 点阵鲸鱼 SVG |

**主题跟随机制**（v7.6）：

- 配色由 `html[data-ds-bg-mode="dark"|"light"]` 两个 CSS 变量块驱动（注意：`data-ds-bg-mode` 是**插件内部的渲染状态**，不是用户选择）
- boot script 的 `resolved()` 只读「宿主系统外观意图」：用户选了深/浅色就读系统 cube 选中态（设置面板在 capture 阶段把它镜像到 localStorage `dsh-ds-home-bg-syspref` 并派发事件），否则跟 `prefers-color-scheme`
- 插件接管期间需要系统暗色时，把 `data-ds-dark-theme` 同时写到 `<html>` + `<body>` 并用 MutationObserver 守护；关闭皮肤时按系统意图让位（只清自己写过的，不动宿主属性）
- 「背景皮肤」开关关闭 → `html[data-ds-bg-disabled]` → 装饰层 `display: none`
- 设置面板注入靠 MutationObserver 扫描 dialog（tab 切换 / 重渲染自动补注入）

## ⚠️ 兼容性与免责声明

- 插件针对**当前 dsh web 版本**（在 dsh 0.x / 2026-09 构建上验证）开发，内部依赖少量 UI 结构（如设置面板分组、主题 cube 的选择器用稳定语义后缀 `[class*="_themeCube"]` 匹配，不依赖 hash 前缀）。**dsh 大版本升级后如出现皮肤开关不显示或装饰层层级异常，请先确认是否为 UI 结构变化所致。**
- 插件是**非官方**个人作品，通过 `webserver/index-inject` 注入实现（该事件由官方主题插件同款机制提供），与 DeepSeek 官方无关。建议先在 `dsh --profile web --patch` 试用模式下验证，确认无问题再正式安装。

## 参考

- 官方主题插件源码：`@deepseek-ai/dsh-client-ui-theme/lib/index.js` —— `webserver/index-inject` 事件的完整用法
- `dsh-host-webserver/lib/types/injections.d.ts` —— 注入行 schema
- `dsh-host-webserver/lib/index.js` —— `renderRow()` 实际渲染逻辑

## License

MIT
