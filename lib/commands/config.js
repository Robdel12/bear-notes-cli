import { parseArgs } from 'node:util'
import { loadConfig, saveConfig } from '../config.js'
import { CONFIG_PATH } from '../constants.js'
import { output } from '../format.js'

export let help = `Usage: bear config <subcommand> [args]

Manage CLI configuration.

Subcommands:
  set <key> <value>   Set a config value
  get <key>           Get a config value
  list                Show all config
  path                Show config file path

Keys: token, defaultLimit, defaultSort

Setup:
  1. Open Bear → Help → Advanced → API Token
  2. Run: bear config set token YOUR_TOKEN`

export async function run(args, globalOpts) {
  let { positionals } = parseArgs({
    args,
    allowPositionals: true,
    strict: false,
    options: {
      help: { type: 'boolean', short: 'h', default: false },
    },
  })

  let [subcommand, ...rest] = positionals

  if (!subcommand || positionals.includes('--help')) {
    console.log(help)
    return
  }

  let json = globalOpts.json

  switch (subcommand) {
    case 'set': {
      let [key, ...valueParts] = rest
      let value = valueParts.join(' ')
      if (!key || !value) {
        console.error('Usage: bear config set <key> <value>')
        process.exit(1)
      }
      let config = loadConfig()
      // Parse numbers
      if (key === 'defaultLimit') value = parseInt(value, 10)
      config[key] = value
      saveConfig(config)
      console.log(`Set ${key} = ${value}`)
      break
    }

    case 'get': {
      let [key] = rest
      if (!key) {
        console.error('Usage: bear config get <key>')
        process.exit(1)
      }
      let config = loadConfig()
      let value = config[key]
      if (json) {
        output({ [key]: value }, true)
      } else {
        console.log(value != null ? String(value) : '(not set)')
      }
      break
    }

    case 'list': {
      let config = loadConfig()
      if (json) {
        output(config, true)
      } else {
        for (let [k, v] of Object.entries(config)) {
          let display = k === 'token' && v ? `${String(v).slice(0, 6)}...` : String(v ?? '(not set)')
          console.log(`${k}: ${display}`)
        }
      }
      break
    }

    case 'path': {
      console.log(CONFIG_PATH)
      break
    }

    default:
      console.error(`Unknown config subcommand: ${subcommand}`)
      console.log(help)
      process.exit(1)
  }
}
