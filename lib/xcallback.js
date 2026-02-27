import { execSync } from 'node:child_process'
import { BEAR_SCHEME } from './constants.js'

export function bearUrl(action, params = {}) {
  let query = new URLSearchParams()
  for (let [k, v] of Object.entries(params)) {
    if (v != null) query.set(k, String(v))
  }

  // URLSearchParams encodes spaces as +, but Bear expects %20
  return `${BEAR_SCHEME}/${action}?${query.toString().replaceAll('+', '%20')}`
}

export function execBear(action, params = {}) {
  let url = bearUrl(action, params)
  execSync(`open "${url}"`)
}
