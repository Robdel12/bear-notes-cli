import { parseArgs } from 'node:util'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear tag-delete <tag-name> [options]

Delete a tag (removes from all notes, does not delete the notes).

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

  let tagName = positionals.join(' ')

  if (!opts.yes) {
    console.error(`To delete tag "${tagName}", re-run with --yes`)
    process.exit(1)
  }

  execBear('delete-tag', {
    name: tagName,
    show_window: 'no',
  })
  console.log(`Deleted tag: "${tagName}"`)
}
