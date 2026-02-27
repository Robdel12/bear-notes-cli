import { parseArgs } from 'node:util'
import { searchNotes } from '../db.js'
import { normalizeNote, output } from '../format.js'
import { toISO } from '../db.js'

export let help = `Usage: bear search <query> [options]

Full-text search through note content.

Options:
  --tag <name>      Filter by tag
  --limit <n>       Max results (default: 20)
  --json            Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      tag:   { type: 'string' },
      limit: { type: 'string', default: '20' },
      help:  { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help || positionals.length === 0) {
    console.log(help)
    return
  }

  let query = positionals.join(' ')
  let notes = searchNotes(query, {
    tag: opts.tag,
    limit: parseInt(opts.limit, 10),
  })

  let json = globalOpts.json || opts.json

  if (json) {
    output(notes.map(normalizeNote), true)
  } else if (notes.length === 0) {
    console.log(`No notes matching "${query}".`)
  } else {
    for (let n of notes) {
      let modified = toISO(n.ZMODIFICATIONDATE)?.slice(0, 10) || ''
      let snippet = (n.ZSNIPPET || '').replace(/\n/g, ' ').trim()
      if (snippet.length > 120) snippet = snippet.slice(0, 120) + '...'
      console.log(`${n.ZTITLE || '(untitled)'}`)
      console.log(`  ${n.ZUNIQUEIDENTIFIER}  ${modified}`)
      if (snippet) console.log(`  ...${snippet}...`)
      console.log()
    }
    console.log(`${notes.length} result${notes.length === 1 ? '' : 's'}`)
  }
}
