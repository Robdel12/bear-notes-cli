import { parseArgs } from 'node:util'
import { resolveNote, getNoteTags } from '../db.js'
import { normalizeNote, formatNoteDetail, output } from '../format.js'

export let help = `Usage: bear get <id-or-title> [options]

Get a note by its UUID or title.

Options:
  --content         Include full note text
  --with-tags       Include tag names
  --json            Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      content:    { type: 'boolean', default: false },
      'with-tags': { type: 'boolean', default: false },
      help:       { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help || positionals.length === 0) {
    console.log(help)
    return
  }

  let query = positionals.join(' ')
  let note = resolveNote(query)

  if (!note) {
    console.error(`Note not found: "${query}"\nTry "bear search ${query}" to find it.`)
    process.exit(1)
  }

  let json = globalOpts.json || opts.json
  let tags = opts['with-tags'] ? getNoteTags(note.Z_PK) : null

  if (json) {
    let data = normalizeNote(note)
    if (!opts.content) delete data.text
    if (tags) data.tags = tags.map(t => t.ZTITLE)
    output(data, true)
  } else {
    console.log(formatNoteDetail(note, {
      content: opts.content,
      tags,
    }))
  }
}
