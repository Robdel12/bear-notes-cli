import { parseArgs } from 'node:util'
import { resolveNote, getBacklinks } from '../db.js'
import { output } from '../format.js'

export let help = `Usage: bear backlinks <id-or-title> [options]

Show backlinks for a note (incoming and outgoing links).

Options:
  --json    Output as JSON`

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

  let links = getBacklinks(note.Z_PK)
  let json = globalOpts.json || opts.json

  if (json) {
    output({
      note: { id: note.ZUNIQUEIDENTIFIER, title: note.ZTITLE },
      incoming: links.incoming.map(l => ({ id: l.ZUNIQUEIDENTIFIER, title: l.ZTITLE })),
      outgoing: links.outgoing.map(l => ({ id: l.ZUNIQUEIDENTIFIER, title: l.ZTITLE })),
    }, true)
    return
  }

  console.log(`Backlinks for "${note.ZTITLE}"`)
  console.log()

  if (links.incoming.length) {
    console.log('Linked by:')
    for (let l of links.incoming) {
      console.log(`  ${l.ZTITLE}  (${l.ZUNIQUEIDENTIFIER})`)
    }
  } else {
    console.log('Linked by: none')
  }

  console.log()

  if (links.outgoing.length) {
    console.log('Links to:')
    for (let l of links.outgoing) {
      console.log(`  ${l.ZTITLE}  (${l.ZUNIQUEIDENTIFIER})`)
    }
  } else {
    console.log('Links to: none')
  }
}
