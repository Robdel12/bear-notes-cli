import { parseArgs } from 'node:util'
import { resolveNote } from '../db.js'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear open <id-or-title> [options]

Open a note in Bear.

Options:
  --header <header>     Jump to a specific heading
  --new-window          Open in a new window
  --edit                Place cursor for editing`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      header:       { type: 'string' },
      'new-window': { type: 'boolean', default: false },
      edit:         { type: 'boolean', default: false },
      help:         { type: 'boolean', short: 'h', default: false },
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

  let params = {
    id: note.ZUNIQUEIDENTIFIER,
    show_window: 'yes',
    open_note: 'yes',
  }
  if (opts.header) params.header = opts.header
  if (opts['new-window']) params.new_window = 'yes'
  if (opts.edit) params.edit = 'yes'

  execBear('open-note', params)
  console.log(`Opened: ${note.ZTITLE}`)
}
