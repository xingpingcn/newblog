import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const article = new URL('../src/content/blog/reverse-engineering-for-beginners/index.mdx', import.meta.url)

test('October 17 update reports independent fresh acceptance without claiming a new permission fix', async () => {
  const source = await readFile(article, 'utf8')
  assert.match(source, /2026-10-17 补记/)
  const update = source.split('## 13. 10 月 17 日续记：')[1]
  assert.ok(update, 'Keep the new investigation separate from historical chapters')
  assert.match(update, /本轮没有修改权限模型/)
  assert.match(update, /两次独立 Node fresh/)
  assert.match(update, /interstitial/)
  assert.match(update, /3\/3/)
  assert.match(update, /同一 HTTP 会话/)
  assert.match(update, /原始 JS 没有重写/)
  assert.match(update, /不代表 slider\/captcha/)
  assert.match(update, /不代表生产/)
})

test('new article section separates browser observation, API query and causality', async () => {
  const source = await readFile(article, 'utf8')
  const update = source.split('## 13. 10 月 17 日续记：')[1]?.split('## 如果从头再做一次')[0]
  assert.ok(update)
  assert.match(update, /IframeAttribute/)
  assert.match(update, /没有调用或截获 `navigator\.permissions\.query\(\)`/)
  assert.match(update, /基线本身也连接 CDP/)
  assert.match(update, /不能证明.*不可检测/)
  assert.match(update, /不是 Node 的答案输入/)
  assert.doesNotMatch(update, /evidence\/private\/|\/home\/ubuntu\/|\.env\b|Proxy-Authorization:/)
})

test('the policy-state teaching example is runnable and leaves unknown separate from denied', async () => {
  const source = await readFile(article, 'utf8')
  const block = source.match(/```js title="可运行：策略允许不等于用户授权"\n([\s\S]*?)\n```/)
  assert.ok(block)
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    "import assert from 'node:assert/strict'; console.assert = (value) => assert.ok(value);\n" + block[1]],
  { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})

test('October 18 section records the browserless production switch without secrets', async () => {
  const source = await readFile(article, 'utf8')
  const update = source.split('## 14. 10 月 17 日晚—18 日：')[1]?.split('## 如果从头再做一次')[0]
  assert.ok(update, 'Keep the production section before the retrospective')
  assert.match(update, /WORKER_BROWSER_MODE=browserless/)
  assert.match(update, /13,210/)
  assert.match(update, /0\/12/)
  assert.match(update, /world/)
  assert.match(update, /153/)
  assert.match(update, /概率/)
  assert.match(update, /9ff1a59/)
  assert.match(update, /694733e/)
  assert.match(update, /0a481dc/)
  assert.doesNotMatch(update, /evidence\/private\/|\/home\/ubuntu\/|\.env\b|Proxy-Authorization:|api[_-]?key|Bearer\s+[A-Za-z0-9]/i)
})

test('the arch/bitness teaching example derives from the declared platform', async () => {
  const source = await readFile(article, 'utf8')
  const block = source.match(/```js title="可运行：从声明平台推导 arch\/bitness"\n([\s\S]*?)\n```/)
  assert.ok(block)
  const result = spawnSync(process.execPath, ['--input-type=module', '-e',
    "import assert from 'node:assert/strict'; console.assert = (value) => assert.ok(value);\n" + block[1]],
  { encoding: 'utf8' })
  assert.equal(result.status, 0, result.stderr)
})
