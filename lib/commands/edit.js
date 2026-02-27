import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { resolveNote } from '../db.js'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear edit <id-or-title> [options]

Add or modify text in a note. Also reads from stdin.

  echo "Appended text" | bear edit "My Note"

Options:
  --text <text>         Text to add
  --mode <mode>         append (default), prepend, replace_all, replace
  --header <header>     Add text under a specific heading
  --tags <tags>         Comma-separated tags to add
  --open                Open the note after editing
  --json                Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      text:    { type: 'string' },
      mode:    { type: 'string', default: 'append' },
      header:  { type: 'string' },
      tags:    { type: 'string' },
      open:    { type: 'boolean', default: false },
      help:    { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help || positionals.length === 0) {
    console.log(help)
    return
  }

  let query = positionals.join(' ')
  let note = resolveNote(query)

  if (!note) {
    console.error(`Note not found: "${query}"`)
    process.exit(1)
  }

  let text = opts.text
  if (!text && !process.stdin.isTTY) {
    text = readFileSync('/dev/stdin', 'utf8')
  }

  if (!text && !opts.tags) {
    console.error('Nothing to add. Provide --text, --tags, or pipe content via stdin.')
    process.exit(1)
  }

  let params = {
    id: note.ZUNIQUEIDENTIFIER,
    mode: opts.mode,
  }
  if (text) params.text = text
  if (opts.header) params.header = opts.header
  if (opts.tags) params.tags = opts.tags
  if (opts.open) {
    params.open_note = 'yes'
    params.show_window = 'yes'
  } else {
    params.open_note = 'no'
    params.show_window = 'no'
  }

  execBear('add-text', params)
  console.log(`Updated: ${note.ZTITLE}`)
}
