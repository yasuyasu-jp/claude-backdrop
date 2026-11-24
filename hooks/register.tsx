import type { Register, ThemeSetArgs } from 'claude-code'

// ─────────────────────────────────────────────────────────────
// 背景カスタマイズ Mod
//   /backdrop                     … 使い方と現在の設定を表示
//   /backdrop night|sunset|ocean|sakura … 動くシーンに切り替え
//   /backdrop color #1e293b       … 単色の背景
//   /backdrop gradient #a #b [角度] … グラデーション背景（色は2〜6個）
//   /backdrop glass 0.4           … シーン上のパネルの不透明度（0〜1）
//   /backdrop off                 … 背景を元に戻す
// 選んだ背景は $.store に保存され、次のセッションでも復元されます。
// ─────────────────────────────────────────────────────────────

const PLUGIN = 'backdrop-switcher'
const W = 1600
const H = 1000

type Choice =
  | { kind: 'scene'; name: SceneName }
  | { kind: 'color'; color: Hex }
  | { kind: 'gradient'; stops: Hex[]; angle: number }
  | { kind: 'off' }

type Hex = `#${string}`

type SceneName = 'night' | 'sunset' | 'ocean' | 'sakura'

// 決定的な乱数（毎回同じ配置になるように）
function rng(seed: number): () => number {
  let s = seed >>> 0
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0
    return s / 4294967296
  }
}

const n = (v: number) => Math.round(v * 10) / 10

function svg(defs: string, style: string, body: string): string {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" preserveAspectRatio="xMidYMid slice">` +
    `<defs>${defs}</defs><style>${style}</style>${body}</svg>`
  )
}

// ── 星空 ─────────────────────────────────────────────
function nightScene(): string {
  const r = rng(7)
  let stars = ''
  for (let i = 0; i < 150; i++) {
    const x = n(r() * W)
    const y = n(r() * H * 0.8)
    const size = n(0.7 + r() * 1.6)
    const cls = `t${1 + Math.floor(r() * 3)}`
    const delay = n(-r() * 9)
    stars += `<circle class="${cls}" cx="${x}" cy="${y}" r="${size}" fill="#fff" style="animation-delay:${delay}s"/>`
  }
  const defs =
    '<linearGradient id="night-sky" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#060a1c"/><stop offset="0.55" stop-color="#121a3b"/><stop offset="1" stop-color="#2a2452"/>' +
    '</linearGradient>' +
    '<radialGradient id="night-glow"><stop offset="0" stop-color="#fdf6d8" stop-opacity="0.45"/><stop offset="1" stop-color="#fdf6d8" stop-opacity="0"/></radialGradient>'
  const style =
    'circle.t1,circle.t2,circle.t3{opacity:0.8}' +
    '.t1{animation:tw 5s ease-in-out infinite}' +
    '.t2{animation:tw 7s ease-in-out infinite}' +
    '.t3{animation:tw 9s ease-in-out infinite}' +
    '@keyframes tw{0%,100%{opacity:0.85}50%{opacity:0.3}}' +
    '.halo{animation:breathe 12s ease-in-out infinite}' +
    '@keyframes breathe{0%,100%{opacity:1}50%{opacity:0.7}}'
  const body =
    `<rect width="${W}" height="${H}" fill="url(#night-sky)"/>` +
    stars +
    '<circle class="halo" cx="1390" cy="170" r="190" fill="url(#night-glow)"/>' +
    '<circle cx="1390" cy="170" r="58" fill="#f6efd2"/>' +
    '<circle cx="1414" cy="152" r="58" fill="#121a3b" opacity="0.92"/>' +
    `<path d="M0 ${H} L0 880 Q160 820 320 870 T660 850 T1000 880 T1340 840 T1600 870 L1600 ${H} Z" fill="#0b0f24"/>`
  return svg(defs, style, body)
}

// ── 夕焼け ───────────────────────────────────────────
function sunsetScene(): string {
  const r = rng(11)
  let clouds = ''
  for (let i = 0; i < 6; i++) {
    const y = n(90 + r() * 360)
    const x = n(r() * W)
    const s = n(0.7 + r() * 0.8)
    const dur = Math.round(90 + r() * 70)
    const delay = n(-r() * dur)
    clouds +=
      `<g transform="translate(${x} ${y}) scale(${s})"><g class="cloud" style="animation-duration:${dur}s;animation-delay:${delay}s">` +
      '<ellipse cx="0" cy="0" rx="120" ry="22" fill="#f7b3a0" opacity="0.55"/>' +
      '<ellipse cx="50" cy="-12" rx="70" ry="18" fill="#fcd0b8" opacity="0.5"/>' +
      '</g></g>'
  }
  let glints = ''
  for (let i = 0; i < 9; i++) {
    const y = 800 + i * 20
    const w = 160 - i * 12
    glints += `<rect class="glint" x="${1300 - w / 2}" y="${y}" width="${w}" height="4" rx="2" fill="#ffd9a0" style="animation-delay:${n(-i * 0.7)}s"/>`
  }
  const defs =
    '<linearGradient id="sunset-sky" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#2b1b4d"/><stop offset="0.4" stop-color="#7c3b6e"/><stop offset="0.72" stop-color="#e2685a"/><stop offset="0.78" stop-color="#f5a35c"/>' +
    '</linearGradient>' +
    '<linearGradient id="sunset-sea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b2f5a"/><stop offset="1" stop-color="#1f1233"/></linearGradient>' +
    '<radialGradient id="sunset-sun"><stop offset="0" stop-color="#ffe6a8"/><stop offset="0.5" stop-color="#ffc277"/><stop offset="1" stop-color="#ffc277" stop-opacity="0"/></radialGradient>'
  const style =
    '.cloud{animation-name:drift;animation-timing-function:linear;animation-iteration-count:infinite}' +
    '@keyframes drift{from{transform:translateX(-300px)}to{transform:translateX(300px)}}' +
    '.glint{opacity:0.6;animation:shimmer 6s ease-in-out infinite}' +
    '@keyframes shimmer{0%,100%{opacity:0.6}50%{opacity:0.25}}'
  const body =
    `<rect width="${W}" height="${H}" fill="url(#sunset-sky)"/>` +
    '<circle cx="1300" cy="770" r="230" fill="url(#sunset-sun)"/>' +
    '<circle cx="1300" cy="770" r="90" fill="#ffdc9a"/>' +
    clouds +
    `<rect y="780" width="${W}" height="${H - 780}" fill="url(#sunset-sea)"/>` +
    glints
  return svg(defs, style, body)
}

// ── 海の中 ───────────────────────────────────────────
function oceanScene(): string {
  const r = rng(23)
  let bubbles = ''
  let keys = ''
  for (let i = 0; i < 34; i++) {
    const x = n(r() < 0.5 ? r() * 420 : W - r() * 420)
    const y = n(80 + r() * 860)
    const size = n(3 + r() * 9)
    const dur = Math.round(16 + r() * 14)
    const delay = n(-r() * dur)
    const sway = n(10 + r() * 30)
    keys +=
      `@keyframes b${i}{0%{transform:translate(0px,${n(H + 40 - y)}px)}50%{transform:translate(${sway}px,${n((H - 2 * y) / 2)}px)}100%{transform:translate(0px,${n(-y - 40)}px)}}`
    bubbles +=
      `<g transform="translate(${x} ${y})"><circle r="${size}" fill="none" stroke="#bfe9ff" stroke-width="1.5" opacity="0.55" ` +
      `style="animation:b${i} ${dur}s linear infinite;animation-delay:${delay}s"/></g>`
  }
  let rays = ''
  for (let i = 0; i < 5; i++) {
    const x = 200 + i * 300 + r() * 80
    rays += `<polygon class="ray" points="${n(x)},0 ${n(x + 90)},0 ${n(x + 260)},${H} ${n(x + 60)},${H}" fill="#9fdcff" style="animation-delay:${n(-i * 2.3)}s"/>`
  }
  const weed = (x: number, h: number, c: string, d: number) =>
    `<path class="weed" style="animation-delay:${d}s" d="M${x} ${H} C${x - 30} ${H - h * 0.35} ${x + 30} ${H - h * 0.65} ${x} ${H - h} C${x + 18} ${H - h * 0.6} ${x - 12} ${H - h * 0.3} ${x + 14} ${H} Z" fill="${c}"/>`
  const defs =
    '<linearGradient id="ocean-deep" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#0b4a6f"/><stop offset="0.5" stop-color="#06304e"/><stop offset="1" stop-color="#03182c"/>' +
    '</linearGradient>'
  const style =
    '.ray{opacity:0.05;animation:ray 11s ease-in-out infinite}' +
    '@keyframes ray{0%,100%{opacity:0.05}50%{opacity:0.11}}' +
    '.weed{transform-box:fill-box;transform-origin:50% 100%;animation:sway 9s ease-in-out infinite}' +
    '@keyframes sway{0%,100%{transform:rotate(-3deg)}50%{transform:rotate(3deg)}}' +
    keys
  const body =
    `<rect width="${W}" height="${H}" fill="url(#ocean-deep)"/>` +
    rays +
    weed(70, 360, '#0f5a4a', 0) +
    weed(120, 260, '#13705a', -3) +
    weed(170, 320, '#0d4d40', -5) +
    weed(1450, 300, '#0f5a4a', -2) +
    weed(1510, 400, '#13705a', -6) +
    weed(1560, 240, '#0d4d40', -4) +
    bubbles
  return svg(defs, style, body)
}

// ── 桜 ──────────────────────────────────────────────
function sakuraScene(): string {
  const r = rng(5)
  let petals = ''
  let keys = ''
  for (let i = 0; i < 40; i++) {
    const x = n(r() * W)
    const y = n(r() * H)
    const dur = Math.round(20 + r() * 16)
    const delay = n(-r() * dur)
    const drift = n(80 + r() * 160)
    const spin = Math.round(180 + r() * 360)
    const s = n(0.6 + r() * 0.7)
    const top = n(-y - 40)
    const bottom = n(H + 40 - y)
    const mid = n((top + bottom) / 2)
    keys +=
      `@keyframes p${i}{0%{transform:translate(${-drift / 2}px,${top}px) rotate(0deg)}` +
      `50%{transform:translate(${drift / 2}px,${mid}px) rotate(${spin / 2}deg)}` +
      `100%{transform:translate(${drift}px,${bottom}px) rotate(${spin}deg)}}`
    petals +=
      `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 -10 C7 -8 9 2 0 10 C-9 2 -7 -8 0 -10 Z" fill="#f4a7bf" opacity="0.85" ` +
      `style="transform-box:fill-box;transform-origin:center;animation:p${i} ${dur}s linear infinite;animation-delay:${delay}s"/></g>`
  }
  let blossoms = ''
  const spots: [number, number][] = [
    [120, 140], [230, 90], [330, 170], [430, 120], [520, 210], [180, 250], [60, 300], [380, 260], [610, 160],
  ]
  for (const [cx, cy] of spots) {
    for (let k = 0; k < 7; k++) {
      const a = r() * Math.PI * 2
      const d = r() * 34
      blossoms += `<circle cx="${n(cx + Math.cos(a) * d)}" cy="${n(cy + Math.sin(a) * d)}" r="${n(10 + r() * 9)}" fill="${r() < 0.5 ? '#f7bcd0' : '#fbd3e0'}" opacity="0.9"/>`
    }
  }
  const defs =
    '<linearGradient id="sakura-sky" x1="0" y1="0" x2="0" y2="1">' +
    '<stop offset="0" stop-color="#fbeef3"/><stop offset="0.6" stop-color="#f7e3ec"/><stop offset="1" stop-color="#f1e6f2"/>' +
    '</linearGradient>'
  const style = keys
  const body =
    `<rect width="${W}" height="${H}" fill="url(#sakura-sky)"/>` +
    '<path d="M-20 60 C120 120 260 140 420 150 C520 156 600 190 660 170 M240 140 C260 200 210 250 180 260 M420 150 C430 210 400 250 380 262" stroke="#6b4a4a" stroke-width="10" stroke-linecap="round" fill="none"/>' +
    blossoms +
    petals
  return svg(defs, style, body)
}

const SCENES: Record<SceneName, { label: string; scheme: 'light' | 'dark'; source: string; alt: string }> = {
  night: { label: '星空', scheme: 'dark', source: nightScene(), alt: '瞬く星と月の夜空' },
  sunset: { label: '夕焼け', scheme: 'dark', source: sunsetScene(), alt: '海に沈む夕日と流れる雲' },
  ocean: { label: '海の中', scheme: 'dark', source: oceanScene(), alt: '光の差す海中と昇る泡' },
  sakura: { label: '桜', scheme: 'light', source: sakuraScene(), alt: '舞い散る桜の花びら' },
}

const isScene = (s: string): s is SceneName => s in SCENES

// ── 色のユーティリティ ───────────────────────────────
const HEX = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i

function normHex(s: string): Hex | undefined {
  const m = HEX.exec(s.trim())
  if (!m || m[1] === undefined) return undefined
  let h = m[1].toLowerCase()
  if (h.length === 3) h = h.split('').map(c => c + c).join('')
  return `#${h}`
}

function luminance(hex: string): number {
  const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255)
  const [r = 0, g = 0, b = 0] = c.map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

const schemeFor = (colors: readonly string[]): 'light' | 'dark' =>
  colors.reduce((sum, c) => sum + luminance(c), 0) / colors.length > 0.35 ? 'light' : 'dark'

// ── 設定 → テーマ ───────────────────────────────────
function lookFor(choice: Choice, glass: number): ThemeSetArgs | undefined {
  switch (choice.kind) {
    case 'scene':
      return {
        backdrop: { scene: choice.name, glass: { blur: 14, opacity: glass } },
        overrideColorScheme: SCENES[choice.name].scheme,
      }
    case 'color':
      return { backdrop: { color: choice.color }, overrideColorScheme: schemeFor([choice.color]) }
    case 'gradient':
      return {
        backdrop: { gradient: { stops: choice.stops, angle: choice.angle } },
        overrideColorScheme: schemeFor(choice.stops),
      }
    case 'off':
      return undefined
  }
}

function describe(choice: Choice): string {
  switch (choice.kind) {
    case 'scene':
      return `シーン「${SCENES[choice.name].label}」(${choice.name})`
    case 'color':
      return `単色 ${choice.color}`
    case 'gradient':
      return `グラデーション ${choice.stops.join(' → ')} (${choice.angle}°)`
    case 'off':
      return 'なし（アプリ標準）'
  }
}

const HELP = [
  '使い方:',
  '  /backdrop night | sunset | ocean | sakura   動くシーン（星空・夕焼け・海の中・桜）',
  '  /backdrop color #1e293b                     単色',
  '  /backdrop gradient #0f172a #6d28d9 135      グラデーション（色2〜6個、最後に角度も可）',
  '  /backdrop glass 0.4                         シーン上のパネルの不透明度 0〜1',
  '  /backdrop off                               背景を元に戻す',
].join('\n')

type Parsed = { choice: Choice } | { glass: number } | { error: string } | { help: true }

function parse(args: string): Parsed {
  const words = args.trim().split(/\s+/).filter(Boolean)
  const [head, ...rest] = words
  if (head === undefined || head === 'help') return { help: true }
  const key = head.toLowerCase()

  if (isScene(key)) return { choice: { kind: 'scene', name: key } }
  if (key === 'off' || key === 'reset') return { choice: { kind: 'off' } }

  if (key === 'color') {
    const c = rest[0] !== undefined ? normHex(rest[0]) : undefined
    return c ? { choice: { kind: 'color', color: c } } : { error: '色は #rrggbb 形式で指定してください（例: /backdrop color #1e293b）' }
  }

  if (key === 'gradient') {
    let angle = 180
    const last = rest[rest.length - 1]
    if (last !== undefined && /^-?\d+(\.\d+)?$/.test(last)) {
      angle = Number(last)
      rest.pop()
    }
    const stops = rest.map(normHex)
    if (stops.length < 2 || stops.length > 6 || stops.some(s => s === undefined)) {
      return { error: 'グラデーションは #rrggbb の色を2〜6個指定してください（例: /backdrop gradient #0f172a #6d28d9 135）' }
    }
    if (angle < -360 || angle > 360) return { error: '角度は -360〜360 で指定してください' }
    return { choice: { kind: 'gradient', stops: stops as Hex[], angle } }
  }

  if (key === 'glass') {
    const v = Number(rest[0])
    return rest[0] !== undefined && v >= 0 && v <= 1
      ? { glass: v }
      : { error: 'glass は 0〜1 の数値で指定してください（例: /backdrop glass 0.4）' }
  }

  // "/backdrop #123456" も単色として受け付ける
  const bare = normHex(head)
  if (bare) return { choice: { kind: 'color', color: bare } }

  return { error: `「${head}」は分かりませんでした。\n${HELP}` }
}

const DEFAULT: Choice = { kind: 'scene', name: 'night' }
const DEFAULT_GLASS = 0.55

async function loadChoice($: { store: { get: (k: string) => Promise<unknown> } }): Promise<Choice> {
  const v = (await $.store.get('choice')) as Choice | undefined
  if (!v || typeof v !== 'object') return DEFAULT
  if (v.kind === 'scene' && !isScene(v.name)) return DEFAULT
  return v
}

async function loadGlass($: { store: { get: (k: string) => Promise<unknown> } }): Promise<number> {
  const v = await $.store.get('glass')
  return typeof v === 'number' && v >= 0 && v <= 1 ? v : DEFAULT_GLASS
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'backdrop',
      description: '会話の背景を切り替える（シーン・単色・グラデーション）',
      argumentHint: '[night|sunset|ocean|sakura|color #hex|gradient #a #b [角度]|glass 0-1|off]',
      immediate: true,
    })

    const look = lookFor(await loadChoice($), await loadGlass($))
    if (look) {
      try {
        const set = await $.theme.set(look)
        if (!set.isDrawn) $.ui.status(`背景: ${set.reason}`)
      } catch (error) {
        $.ui.log(String(error))
      }
    }

    return next(e)
  })

  on('command.run', { command: 'backdrop' }, async ($, e) => {
    const parsed = parse(e.args)

    if ('help' in parsed) {
      const current = describe(await loadChoice($))
      return { text: `現在の背景: ${current}\n${HELP}` }
    }
    if ('error' in parsed) return { text: parsed.error }

    let choice = await loadChoice($)
    let glass = await loadGlass($)
    if ('glass' in parsed) {
      glass = parsed.glass
      await $.store.set('glass', glass)
    } else {
      choice = parsed.choice
      await $.store.set('choice', choice)
    }

    const look = lookFor(choice, glass)
    if (!look) {
      await $.theme.clear()
      return { text: '背景を元に戻しました。' }
    }

    try {
      const set = await $.theme.set(look)
      const suffix = set.isDrawn ? '' : `\n（この画面では表示されません: ${set.reason}）`
      const what = 'glass' in parsed ? `パネルの不透明度を ${glass} にしました` : `背景を ${describe(choice)} にしました`
      return { text: `${what}。${suffix}` }
    } catch (error) {
      return { text: `背景を設定できませんでした: ${String(error)}` }
    }
  })

  on('ui.render', { component: 'Backdrop' }, ($, e, next) => {
    if (e.surface !== 'desktop' && e.surface !== 'mobile') return next(e)
    if (e.props.plugin !== PLUGIN || !isScene(e.props.scene)) return next(e)

    const scene = SCENES[e.props.scene]
    const { Svg } = $.ui.resolve(e)

    return <Svg source={scene.source} alt={scene.alt} />
  })
}
