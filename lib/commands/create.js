import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { execBear } from '../xcallback.js'

export let help = `Usage: bear create [options]

Create a new note in Bear. Also reads from stdin.

  echo "Hello" | bear create --title "My Note"

Options:
  --title <title>   Note title
  --text <text>     Note body text
  --tags <tags>     Comma-separated tags
  --pin             Pin the note
  --open            Open the note in Bear after creating`

export async function run(args, globalOpts) {
  let { values: opts } = parseArgs({
    args,
    strict: false,
    options: {
      title: { type: 'string' },
      text:  { type: 'string' },
      tags:  { type: 'string' },
      pin:   { type: 'boolean', default: false },
      open:  { type: 'boolean', default: false },
      help:  { type: 'boolean', short: 'h', default: false },
    },
  })

  if (opts.help) {
    console.log(help)
    return
  }

  // Read from stdin if available
  let text = opts.text
  if (!text && !process.stdin.isTTY) {
    text = readFileSync('/dev/stdin', 'utf8')
  }

  let params = {}
  if (opts.title) params.title = opts.title
  if (text) params.text = text
  if (opts.tags) params.tags = opts.tags
  if (opts.pin) params.pin = 'yes'
  if (opts.open) {
    params.open_note = 'yes'
    params.show_window = 'yes'
  } else {
    params.open_note = 'no'
    params.show_window = 'no'
  }

  execBear('create', params)
  console.log(`Created: ${opts.title || '(untitled)'}`)
}
