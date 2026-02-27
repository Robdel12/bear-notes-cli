import { execSync } from 'node:child_process'
import { createServer } from 'node:http'
import { BEAR_SCHEME } from './constants.js'
import { getToken } from './config.js'

export function bearUrl(action, params = {}) {
  let token = getToken()
  if (token) params.token = token

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

export function execBearWithCallback(action, params = {}) {
  return new Promise((resolve, reject) => {
    let server = createServer((req, res) => {
      let url = new URL(req.url, 'http://localhost')
      let data = Object.fromEntries(url.searchParams)
      res.writeHead(200, { 'Content-Type': 'text/plain' })
      res.end('OK')
      server.close()

      if (data.error) {
        reject(new Error(data.errorMessage || 'Bear returned an error'))
      } else {
        resolve(data)
      }
    })

    server.listen(0, '127.0.0.1', () => {
      let { port } = server.address()
      params['x-success'] = `http://127.0.0.1:${port}/`
      params['x-error'] = `http://127.0.0.1:${port}/?error=true`

      let url = bearUrl(action, params)
      execSync(`open "${url}"`)
    })

    // Let process exit if Bear never responds
    server.unref()
  })
}
