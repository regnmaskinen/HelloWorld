import git from 'isomorphic-git'
import http from '/Users/magnehatteland/Documents/Vibe/helloworld/node_modules/isomorphic-git/http/node/index.js'
import fs from 'fs'
import path from 'path'

const dir = process.cwd()
const token = process.argv[2]

await git.init({ fs, dir })
await git.addRemote({ fs, dir, remote: 'origin', url: 'https://github.com/regnmaskinen/HelloWorld.git', force: true })

// Stage all files
const status = await git.statusMatrix({ fs, dir })
for (const [filepath, , workdir] of status) {
  if (workdir !== 0) {
    await git.add({ fs, dir, filepath })
  }
}

await git.commit({
  fs,
  dir,
  message: 'Initial commit: Hello World in multiple languages',
  author: { name: 'regnmaskinen', email: 'regnmaskinen@users.noreply.github.com' },
})

console.log('Pushing to GitHub...')
const result = await git.push({
  fs,
  http,
  dir,
  remote: 'origin',
  ref: 'main',
  onAuth: () => ({ username: token }),
  force: true,
})

console.log('Done!', result)
