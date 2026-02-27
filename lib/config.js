import { readFileSync, writeFileSync } from 'node:fs'
import { CONFIG_PATH } from './constants.js'

let defaults = {
  token: null,
  defaultLimit: 20,
  defaultSort: 'modified',
}

export function loadConfig() {
  try {
    let raw = readFileSync(CONFIG_PATH, 'utf8')
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function saveConfig(config) {
  writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2) + '\n')
}

export function getToken() {
  let config = loadConfig()
  return config.token
}
