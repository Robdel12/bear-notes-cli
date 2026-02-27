import { parseArgs } from 'node:util'
import { listNotes } from '../db.js'
import { normalizeNote, formatNoteRow, output } from '../format.js'

export let help = `Usage: bear list [options]

List notes with optional filters.

Options:
  --tag <name>      Filter by tag name
  --archived        Show archived notes
  --trashed         Show trashed notes
  --pinned          Show only pinned notes
  --has-todo        Show notes with todos
  --limit <n>       Max results (default: 20)
  --sort <field>    Sort by: modified, created, title (default: modified)
  --order <dir>     Sort direction: asc, desc (default: desc)
  --json            Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts } = parseArgs({
    args,
    strict: false,
    options: {
      tag:      { type: 'string' },
      archived: { type: 'boolean', default: false },
      trashed:  { type: 'boolean', default: false },
      pinned:   { type: 'boolean', default: false },
      'has-todo': { type: 'boolean', default: false },
      limit:    { type: 'string', default: '20' },
      sort:     { type: 'string', default: 'modified' },
      order:    { type: 'string', default: 'desc' },
      help:     { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help) {
    console.log(help)
    return
  }

  let notes = listNotes({
    tag: opts.tag,
    archived: opts.archived || undefined,
    trashed: opts.trashed,
    pinned: opts.pinned,
    hasTodo: opts['has-todo'],
    limit: parseInt(opts.limit, 10),
    sort: opts.sort,
    order: opts.order,
  })

  let json = globalOpts.json || opts.json

  if (json) {
    output(notes.map(normalizeNote), true)
  } else if (notes.length === 0) {
    console.log('No notes found.')
  } else {
    console.log(notes.map(formatNoteRow).join('\n\n'))
    console.log(`\n${notes.length} note${notes.length === 1 ? '' : 's'}`)
  }
}
