import { parseArgs } from 'node:util'
import { resolveNote } from '../db.js'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear archive <id-or-title>

Archive a note.`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
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

  execBear('archive', {
    id: note.ZUNIQUEIDENTIFIER,
    show_window: 'no',
  })
  console.log(`Archived: ${note.ZTITLE}`)
}
