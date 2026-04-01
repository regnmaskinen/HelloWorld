import git from 'isomorphic-git'
import http from '/Users/magnehatteland/Documents/Vibe/helloworld/node_modules/isomorphic-git/http/node/index.js'
import fs from 'fs'

const dir = process.cwd()
const token = process.argv[2]

const status = await git.statusMatrix({ fs, dir })
for (const [filepath, , workdir] of status) {
  if (workdir !== 0) await git.add({ fs, dir, filepath })
}

// Also remove deleted files
const deletedFiles = (await git.statusMatrix({ fs, dir }))
  .filter(([, head, workdir]) => head === 1 && workdir === 0)
  .map(([f]) => f)
for (const f of deletedFiles) await git.remove({ fs, dir, filepath: f })

await git.commit({
  fs, dir,
  message: 'Replace with Spider Squirter FPS game',
  author: { name: 'regnmaskinen', email: 'regnmaskinen@users.noreply.github.com' },
})

const result = await git.push({
  fs, http, dir,
  remote: 'origin',
  ref: 'master',
  remoteRef: 'main',
  onAuth: () => ({ username: token }),
  force: true,
})
console.log('Pushed:', result.ok)
