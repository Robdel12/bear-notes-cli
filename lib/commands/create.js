import { parseArgs } from 'node:util'
import { readFileSync } from 'node:fs'
import { execBear, execBearWithCallback } from '../xcallback.js'
import { output } from '../format.js'

export let help = `Usage: bear create [options]

Create a new note in Bear. Also reads from stdin.

  echo "Hello" | bear create --title "My Note"

Options:
  --title <title>   Note title
  --text <text>     Note body text
  --tags <tags>     Comma-separated tags
  --pin             Pin the note
  --open            Open the note in Bear after creating
  --no-wait         Fire and forget (don't wait for callback)
  --json            Output as JSON`

export async function run(args, globalOpts) {
  let { values: opts } = parseArgs({
    args,
    strict: false,
    options: {
      title:    { type: 'string' },
      text:     { type: 'string' },
      tags:     { type: 'string' },
      pin:      { type: 'boolean', default: false },
      open:     { type: 'boolean', default: false },
      'no-wait': { type: 'boolean', default: false },
      help:     { type: 'boolean', short: 'h', default: false },
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

  let json = globalOpts.json || opts.json

  if (opts['no-wait']) {
    execBear('create', params)
    if (json) {
      output({ status: 'sent' }, true)
    } else {
      console.log('Note creation sent to Bear.')
    }
    return
  }

  try {
    let result = await execBearWithCallback('create', params)
    if (json) {
      output(result, true)
    } else {
      console.log(`Created: ${result.title || opts.title || '(untitled)'}`)
      if (result.identifier) console.log(`ID: ${result.identifier}`)
    }
  } catch (err) {
    console.error(`Failed to create note: ${err.message}`)
    process.exit(1)
  }
}
