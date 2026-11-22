#!/usr/bin/env node
import { chromium } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { spawn } from 'node:child_process'

const root = path.dirname(fileURLToPath(import.meta.url))
const outDir = path.join(root, '..', '.agent-run', 'v2-shots')
fs.mkdirSync(outDir, { recursive: true })

const scenarios = ['questions', 'none', 'raise', 'jobchange', 'missed', 'bonus', 'combo']

const server = spawn('npm', ['run', 'dev', '--', '--host', '127.0.0.1', '--port', '5174'], {
  cwd: path.join(root, '..', 'apps', 'web-v2'),
  stdio: 'pipe',
  shell: true,
})

await new Promise((r) => setTimeout(r, 3000))

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 390, height: 844 } })

for (const id of scenarios) {
  await page.goto(`http://127.0.0.1:5174/v2/?scenario=${id}`, { waitUntil: 'networkidle' })
  await page.screenshot({ path: path.join(outDir, `${id}-mobile.png`), fullPage: true })
}

await browser.close()
server.kill('SIGTERM')
console.log('Saved', scenarios.length, 'journey screenshots to', outDir)