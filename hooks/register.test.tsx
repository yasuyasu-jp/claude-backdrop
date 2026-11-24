import { expect, test } from 'claude-code/testing'
import type { ThemeSetArgs } from 'claude-code'

test('/backdrop switches the backdrop and remembers it', async ($, on) => {
  const looks: ThemeSetArgs[] = []
  const run = (args: string) =>
    $.command.run({ command: 'backdrop', args } as Parameters<typeof $.command.run>[0])
  const store = new Map<string, unknown>()
  on('store.get', (_, e) => ({ value: store.get(e.key) }))
  on('store.set', (_, e) => {
    store.set(e.key, e.value)
    return { value: undefined }
  })
  on('theme.set', (_, e) => {
    looks.push(e)
    return { value: { isDrawn: true, requestId: 'theme' } }
  })

  const ocean = await run('ocean')
  expect(ocean.text).toContain('海の中')
  expect(looks.at(-1)?.backdrop).toEqual({ scene: 'ocean', glass: { blur: 14, opacity: 0.55 } })

  await run('gradient #fff #fbcfe8 90')
  expect(looks.at(-1)?.backdrop).toEqual({ gradient: { stops: ['#ffffff', '#fbcfe8'], angle: 90 } })
  expect(looks.at(-1)?.overrideColorScheme).toBe('light')

  const help = await run('')
  expect(help.text).toContain('グラデーション #ffffff → #fbcfe8')

  expect(store.get('choice')).toEqual({ kind: 'gradient', stops: ['#ffffff', '#fbcfe8'], angle: 90 })

  const bad = await run('color red')
  expect(bad.text).toContain('#rrggbb')
})

test('the scene draws on desktop', async $ => {
  const ui = await $.ui.mount({
    plugin: 'backdrop-switcher',
    surface: 'desktop',
    component: 'Backdrop',
    props: { scene: 'sakura', plugin: 'backdrop-switcher', glass: { blur: 14, opacity: 0.55 } },
  })
  expect(await ui.find({ type: 'Svg' })).toBeDefined()
  await ui.unmount()
})
