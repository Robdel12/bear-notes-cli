#!/usr/bin/env -S node --disable-warning=ExperimentalWarning

import { readFileSync } from 'node:fs'

// Manually split argv into global flags + command + rest
// This avoids parseArgs consuming flags meant for subcommands
let rawArgs = process.argv.slice(2)
let globalOpts = { json: false, help: false, version: false }
let commandIndex = -1

for (let i = 0; i < rawArgs.length; i++) {
  let arg = rawArgs[i]
  if (arg === '--json') { globalOpts.json = true; continue }
  if (arg === '--help' || arg === '-h') { globalOpts.help = true; continue }
  if (arg === '--version' || arg === '-v') { globalOpts.version = true; continue }
  // First non-global-flag is the command
  commandIndex = i
  break
}

let command = commandIndex >= 0 ? rawArgs[commandIndex] : null
let rest = commandIndex >= 0 ? rawArgs.slice(commandIndex + 1) : []

if (globalOpts.version) {
  let pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'))
  console.log(pkg.version)
  process.exit(0)
}

let commands = {
  list:         () => import('../lib/commands/list.js'),
  ls:           () => import('../lib/commands/list.js'),
  get:          () => import('../lib/commands/get.js'),
  search:       () => import('../lib/commands/search.js'),
  create:       () => import('../lib/commands/create.js'),
  new:          () => import('../lib/commands/create.js'),
  edit:         () => import('../lib/commands/edit.js'),
  trash:        () => import('../lib/commands/trash.js'),
  archive:      () => import('../lib/commands/archive.js'),
  open:         () => import('../lib/commands/open.js'),
  tags:         () => import('../lib/commands/tags.js'),
  'tag-rename': () => import('../lib/commands/tag-rename.js'),
  'tag-delete': () => import('../lib/commands/tag-delete.js'),
  backlinks:    () => import('../lib/commands/backlinks.js'),
  stats:        () => import('../lib/commands/stats.js'),
  export:       () => import('../lib/commands/export.js'),
  config:       () => import('../lib/commands/config.js'),
}

if (!command || globalOpts.help) {
  console.log(`bear-cli — Manage Bear notes from the command line

Usage: bear <command> [options]

Read commands (SQLite — fast, works without Bear running):
  list, ls          List notes with filters
  get <id|title>    Get a note by ID or title
  search <query>    Full-text search notes
  tags              List all tags
  backlinks <id>    Show note backlinks
  stats             Database statistics
  export <id>       Export note content

Write commands (x-callback-url — requires Bear running):
  create, new       Create a new note
  edit <id>         Add or modify note text
  open <id>         Open a note in Bear
  trash <id>        Move a note to trash
  archive <id>      Archive a note
  tag-rename        Rename a tag
  tag-delete        Delete a tag

Config:
  config            Manage CLI settings

Global options:
  --json            Output as JSON
  -h, --help        Show help
  -v, --version     Show version

Run "bear <command> --help" for command-specific help.`)
  process.exit(0)
}

if (!commands[command]) {
  console.error(`Unknown command: ${command}\nRun "bear --help" for usage.`)
  process.exit(1)
}

let mod = await commands[command]()
await mod.run(rest, globalOpts)
