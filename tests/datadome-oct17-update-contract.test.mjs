import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const article = new URL('../src/content/blog/reverse-engineering-for-beginners/index.mdx', import.meta.url)

test('October 17 update reports independent fresh acceptance without claiming a new permission fix', async () => {
  const source = await readFile(article, 'utf8')
  assert.match(source, /2026-10-17 补记/)
  const update = source.split('## 13. 10 月 17 日续记：')[1]?.split('## 14.')[0]
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
  const update = source.split('## 13. 10 月 17 日续记：')[1]?.split('## 14.')[0]
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

test('October 18 section keeps identity analysis and outcome statistics, not crawler operations', async () => {
  const source = await readFile(article, 'utf8')
  const update = source.split('## 14. 10 月 17 日晚—18 日：')[1]?.split('## 如果从头再做一次')[0]
  assert.ok(update, 'Keep the identity investigation before the retrospective')
  assert.match(update, /声明身份/)
  assert.match(update, /传输指纹/)
  assert.match(update, /Client Hints/)
  assert.match(update, /0\/12/)
  assert.match(update, /153/)
  assert.match(update, /概率/)
  const operations = /\bseed\b|discovered_count|new_count|0a481dc|WORKER_BROWSER_MODE|docker compose|构建期配置|镜像变体|健康检查|槽位轮换/i
  assert.equal(operations.test(source), false, 'Keep crawler and deployment operations out of the article')
  const privateMaterial = /evidence\/private\/|\/home\/ubuntu\/|\.env\b|Proxy-Authorization:|api[_-]?key\s*[:=]|Bearer\s+[A-Za-z0-9]|https?:\/\/[^\s/]+:[^\s/]+@|-----BEGIN [A-Z ]*PRIVATE KEY-----/i
  assert.equal(privateMaterial.test(source), false, 'Do not publish private paths or credential patterns')
})

test('production statistics retain the historical window, consistent totals and separate denominators', async () => {
  const source = await readFile(article, 'utf8')
  const statistics = source.split('#### 历史生产窗口：轮次、挑战和入库')[1]?.split('### 14.5')[0]
  assert.ok(statistics, 'Retain production outcomes without restoring deployment instructions')
  assert.match(statistics, /`2026-10-17 19:33 UTC`.*`2026-10-18 02:12 UTC`/, 'Keep timestamps in code spans so colon directives cannot consume the minutes')
  assert.match(statistics, /历史窗口.*不是实时/)
  assert.match(statistics, /\| 完成轮次 \| 76 \|/)
  assert.match(statistics, /\| 新增并入库 \| 16 篇 \|/)
  assert.match(statistics, /\| 出现挑战的轮次 \| 30 \/ 76（约 39\.5%） \|/)
  assert.match(statistics, /\| 挑战事件总数 \| 143 \|/)

  const distribution = statistics.match(/\| 单轮挑战次数 \| 对应轮数 \|\n\|[^\n]+\|\n((?:\| \d+ \| \d+ \|\n)+)/)
  assert.ok(distribution, 'Keep the observed distribution inspectable')
  const bins = [...distribution[1].matchAll(/\| (\d+) \| (\d+) \|/g)]
    .map(([, challenges, rounds]) => [Number(challenges), Number(rounds)])
  assert.deepEqual(bins, [[0, 46], [3, 1], [4, 24], [8, 4], [12, 1]])
  assert.equal(bins.reduce((sum, [, rounds]) => sum + rounds, 0), 76)
  assert.equal(bins.filter(([challenges]) => challenges > 0).reduce((sum, [, rounds]) => sum + rounds, 0), 30)
  assert.equal(bins.reduce((sum, [challenges, rounds]) => sum + challenges * rounds, 0), 143)
  assert.match(statistics, /不能把.*60\.5%.*成功率/)
  assert.match(statistics, /不是 143 次独立 fresh/)
  assert.match(statistics, /入库量不是挑战成功率/)
  for (const stage of ['发现', '取文', '入库']) {
    assert.ok(statistics.includes(`- **${stage}**`), `Explain ${stage} separately`)
  }
  assert.match(statistics, /严格 `3\/3`/)
  assert.match(statistics, /恢复.*几十秒到一两分钟/)
  assert.match(statistics, /不是.*Node.*执行耗时/)
  assert.match(statistics, /不能.*长期稳定/)
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
