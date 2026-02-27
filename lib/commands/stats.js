import { parseArgs } from 'node:util'
import { getStats } from '../db.js'
import { output } from '../format.js'

export let help = `Usage: bear stats [options]

Show database statistics.

Options:
  --json    Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts } = parseArgs({
    args,
    strict: false,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help) {
    console.log(help)
    return
  }

  let s = getStats()
  let json = globalOpts.json || opts.json

  if (json) {
    output(s, true)
    return
  }

  console.log(`Notes
  Active:     ${s.active}
  Archived:   ${s.archived}
  Trashed:    ${s.trashed}
  Pinned:     ${s.pinned}
  Encrypted:  ${s.encrypted}
  Total:      ${s.total}

Attachments: ${s.withAttachments} notes with files/images (${s.files} files)
Tags:        ${s.tags}
Backlinks:   ${s.backlinks}
Todos:       ${s.todosComplete || 0} done, ${s.todosIncomplete || 0} remaining`)
}
