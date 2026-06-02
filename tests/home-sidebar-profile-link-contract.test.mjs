import { readFile } from 'node:fs/promises'
import assert from 'node:assert/strict'

const root = new URL('../', import.meta.url)

async function readProjectFile(path) {
  return await readFile(new URL(path, root), 'utf8')
}

const profileCard = await readProjectFile('src/components/profile-card.astro')
const homeSidebar = await readProjectFile('src/components/home-sidebar.astro')

assert.match(
  profileCard,
  /profileHref\?:\s*string/,
  'profile card should accept an explicit profile href override',
)

assert.match(
  profileCard,
  /const\s+\{\s*author,\s*compact\s*=\s*false,\s*profileHref\s*=\s*`\/authors\/\$\{author\.id\}`\s*\}\s*=\s*Astro\.props/,
  'profile card should default avatar links to the author detail page',
)

assert.match(
  profileCard,
  /<Link\s+href=\{profileHref\}\s+class="shrink-0">/,
  'profile card avatar link should use the configured profile href',
)

assert.match(
  homeSidebar,
  /<ProfileCard\s+author=\{author\}\s+compact\s+profileHref="\/about"\s*\/>/,
  'home sidebar avatar should link to the about page instead of the author page',
)
