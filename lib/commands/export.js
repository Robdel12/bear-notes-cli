import { parseArgs } from 'node:util'
import { writeFileSync } from 'node:fs'
import { resolveNote, getNoteTags, toISO } from '../db.js'
import { output } from '../format.js'

export let help = `Usage: bear export <id-or-title> [options]

Export a note's content.

Options:
  --output <file>   Write to file instead of stdout
  --json            Output as JSON with metadata`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      output: { type: 'string', short: 'o' },
      help:   { type: 'boolean', short: 'h', default: false },
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

  let json = globalOpts.json || opts.json

  if (json) {
    let tags = getNoteTags(note.Z_PK)
    output({
      id: note.ZUNIQUEIDENTIFIER,
      title: note.ZTITLE,
      created: toISO(note.ZCREATIONDATE),
      modified: toISO(note.ZMODIFICATIONDATE),
      tags: tags.map(t => t.ZTITLE),
      text: note.ZTEXT,
    }, true)
    return
  }

  let text = note.ZTEXT || ''

  if (opts.output) {
    writeFileSync(opts.output, text)
    console.log(`Exported to ${opts.output}`)
  } else {
    process.stdout.write(text)
  }
}
