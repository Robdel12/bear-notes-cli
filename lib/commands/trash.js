import { parseArgs } from 'node:util'
import { resolveNote } from '../db.js'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear trash <id-or-title> [options]

Move a note to trash.

Options:
  --yes    Skip confirmation`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      yes:  { type: 'boolean', short: 'y', default: false },
      help: { type: 'boolean', short: 'h', default: false },
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

  if (!opts.yes) {
    console.error(`To trash "${note.ZTITLE}", re-run with --yes`)
    process.exit(1)
  }

  execBear('trash', {
    id: note.ZUNIQUEIDENTIFIER,
    show_window: 'no',
  })
  console.log(`Trashed: ${note.ZTITLE}`)
}
