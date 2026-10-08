// Runs a bash script: node scripts/bash.mjs scripts/screenshots.sh
// On Windows it uses the bash that comes with Git. The "bash" on the path there is often WSL's, which cannot run
// the Windows programs the scripts call (npm, php).
import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

function gitBash() {
  // "C:/Program Files/Git/mingw64/libexec/git-core" → "C:/Program Files/Git/bin/bash.exe"
  const execPath = execFileSync('git', ['--exec-path'], { encoding: 'utf8' }).trim()
  const bash = resolve(execPath, '../../../bin/bash.exe')
  return existsSync(bash) ? bash : 'bash'
}

const bash = process.platform === 'win32' ? gitBash() : 'bash'
const { status, error } = spawnSync(bash, process.argv.slice(2), { stdio: 'inherit' })
if (error) throw error
process.exit(status ?? 1)
