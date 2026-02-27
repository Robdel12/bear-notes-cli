import { parseArgs } from 'node:util'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear tag-rename <old-name> <new-name>

Rename a tag.`

export async function run(args, globalOpts) {
  let { values: opts, positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help || positionals.length < 2) {
    console.log(help)
    return
  }

  let [oldName, newName] = positionals

  execBear('rename-tag', {
    name: oldName,
    new_name: newName,
    show_window: 'no',
  })
  console.log(`Renamed tag: "${oldName}" → "${newName}"`)
}
