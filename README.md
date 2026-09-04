# dsh-ds-home-bg

> A deep-navy aurora background theme for the DeepSeek Harness web UI: layered radial glows, a fine grid, and a drifting halftone whale. The palette follows the host **Appearance** setting automatically — no separate theme picker, so it can never disagree with your light/dark choice.

## What you get

### Dark palette

- **Base** `#0B1120` deep navy-black
- **Three glows** left `#1A3870`, centre `#4A8AC4` → `#2D5F9E`, right `#2D5F9E` → `#1A3870`, breathing slowly on different cycles
- **Grid** 44 px × 44 px, faint blue (`rgba(74,138,196,0.06)`), visible across the central 90 %
- **Halftone whale** a square-dot whale motif tucked inside the upper-right glow, floating

### Light palette

- **Base** `#EEF3FA` blue-tinted white; panels return to their native light surfaces
- **Softer glows** `#A9C8F0` / `#D7E6F9` / `#8FB8E8`
- **Halftone whale** in deep blue dots, barely there

### Settings toggle

The switch lives in **Settings → General**, in a *Background skin* group placed right after the system *Appearance* group.

- **Palette always follows Appearance** — pick Dark and you get the deep-sea look, pick Light for the shallow-sea look, pick *System* to follow `prefers-color-scheme` live. The skin has no theme choice of its own by design.
- **Background skin switch** — turning it off hides all decoration (glows / grid / whale) and restores the stock background instantly; turning it back on restores the skin.

State persists in browser `localStorage`:

| Key | Value | Purpose |
|-----|-------|---------|
| `dsh-ds-home-bg-enabled` | `'true'` / `'false'` | Master switch |
| `dsh-ds-home-bg-syspref` | `'light'` / `'dark'` / `'system'` | Mirror of the host Appearance selection, used to hand `data-ds-dark-theme` back to the host when the skin is turned off |
| `dsh-ds-home-bg-mode` | deprecated | Pre-v7.6 key; cleaned up at boot |

## Install

### One command, from GitHub

```sh
dsh plugin --profile web add github:Alphauni-x/dsh-ds-home-bg
```

Then restart `dsh web`. The plugin registers itself into the profile's bundle stack and applies on every subsequent boot.

This package ships **plain ESM with zero dependencies and no build step**, so pnpm's default "blocked build scripts" policy never comes into play — there is nothing to compile after checkout.

### From a local checkout

```sh
dsh plugin --profile web add /absolute/path/to/dsh-ds-home-bg
```

### Uninstall

```sh
dsh plugin --profile web remove dsh-ds-home-bg
pkill -f "dsh web" && sleep 2 && dsh web
```

## Configuration

Append to `~/.dsh/profiles/web/cordis.patch.yml`:

```yaml
- id: ds-home-bg
  config:
    base: "#0B1120"     # background base colour
    glow1: "#1A3870"    # lower-left glow
    glow2: "#4A8AC4"    # upper-centre glow
    glow3: "#2D5F9E"    # lower-right glow
    grid: "rgba(74, 138, 196, 0.06)"   # grid line colour
    blur: 140           # glow blur radius, px
    opacity: 0.45       # overall glow strength
    animation: true     # enable breathing animation
```

Config changes **hot-reload** — save the file and the loader re-applies, no restart needed.

## Restart requirement

`webserver/index-inject` fires once at boot, and Cordis HMR does **not** re-inject the `<style>` row. After editing `index.js` you must restart:

```sh
pkill -f "dsh web" && sleep 2 && dsh web
```

Only `config:` values hot-reload; code does not.

## How it works

The plugin listens for `webserver/index-inject` and pushes four rows into the index table:

| `kind` | Placement | Field | Purpose |
|--------|-----------|-------|---------|
| `style` | end of `<head>` | `text` | Both palettes as CSS custom properties, decoration layer styles, switch styles |
| `script` (boot) | end of `<body>` | `text` | Resolves host Appearance intent, guards `data-ds-dark-theme`, exposes `window.__dsBgSettings`, listens for `ds-bg-syspref` |
| `script` (settings) | end of `<body>` | `text` | Injects the *Background skin* group into the settings dialog; mirrors the Appearance selection during the capture phase |
| `html` | end of `<body>` | `html` | The glow decoration `<div>` plus the halftone whale SVG |

Theme resolution (v7.6+):

- Palettes are driven by `html[data-ds-bg-mode="dark"|"light"]`. This attribute is the plugin's **render state**, not a user setting.
- The boot script reads only host intent: the mirrored Appearance cube selection if present, otherwise `prefers-color-scheme`.
- While the skin is active and dark is required, `data-ds-dark-theme` is written to both `<html>` and `<body>` and guarded by a `MutationObserver`. When the skin is switched off, the attribute is handed back according to host intent — the plugin only clears what it wrote itself.
- Switch off → `html[data-ds-bg-disabled]` → decoration layer `display: none`.
- Settings injection uses a MutationObserver over dialogs, so tab switches and React re-renders re-inject automatically.

## Stacking model (v7.6.5)

This is the part that broke before, so it is documented deliberately.

- The decoration layer sits at **`z-index: 10`**. Measured against the current host UI: content layers are `1` / `2`, and the dialog container (`*_overlayLayer`) is `20`. So `10` renders above content and below every popup — the skin is fully visible without ever covering a dialog.
- `#root { z-index: auto !important }` is **required**: `#root` is natively `relative` + `z-index: 0`, which would trap the overlay layer's `20` inside its own stacking context.
- Do **not** raise the decoration back to `99998`. Anything above the popups forces you to re-lift dialogs, and a blanket `[role="dialog"] { z-index: … !important }` collapses a settings panel and the confirm dialog rendered inside it to the same value — the confirm dialog then paints *under* the panel and appears to be a dead button.
- Do **not** lower it to `-1`. Several host containers paint opaque backgrounds (`*_frame`, conversation roots), which hide the decoration entirely.
- The switch's state colours are written as `.ds-bg-switch[aria-checked="…"]` with `!important`. A broad `[class*="bg-"]` panel rule matches `ds-bg-switch` by substring, so the attribute selector is needed to win the cascade; `:not(.ds-bg-switch)` was also added at the source.

## Other UI details

- **Opaque popups** — dialogs are solid (dark `rgba(20,32,60,0.92)`, light `rgba(249,251,254,0.99)`) so content underneath never bleeds through.
- **Popup menus** (v7.6.3) — the host gives dropdown/popup containers a translucent glass fill, which makes menu text collide with what's behind it in dark mode. All `[role="menu"]` surfaces are made opaque with an 8 px backdrop blur.
- **Streaming status shimmer** (v7.6.4) — the "Deep diving…" thinking indicator sets `background-clip: text` with a transparent text fill but never supplies a `background-image`, so the label is permanently invisible. A MutationObserver detects the element and injects a brand-blue gradient plus a `ds-bg-shimmer` keyframe via inline `!important`, which is the only priority level that escapes the animation context.

## Compatibility

Built and verified against the dsh web build from 2026-09. The plugin depends on a small number of host UI structures; selectors use stable semantic suffixes (for example `[class*="_themeCube"]`) rather than CSS-Module hash prefixes, which change on every build.

If a future dsh release hides the skin switch or misplaces the decoration layer, check for a host UI structure change first — the stacking model above is the usual culprit.

This is an independent community theme plugin. It is not affiliated with or endorsed by DeepSeek.

## References

- `@deepseek-ai/dsh-client-ui-theme` — the bundled theme package, reference implementation of `webserver/index-inject`
- `dsh-host-webserver/lib/types/injections.d.ts` — injected row schema
- `dsh-host-webserver/lib/index.js` — `renderRow()`, how each row is actually emitted

## License

MIT
