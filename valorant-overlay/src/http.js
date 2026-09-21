import https from 'node:https'
import http from 'node:http'
import { URL } from 'node:url'

/**
 * Minimal promise-based request helper. Used for everything (the local Riot
 * client, Riot's player-data endpoints, valorant-api.com) so the project stays
 * dependency-free. `insecure` is required for the local client, which serves a
 * self-signed certificate on 127.0.0.1.
 */
export function request(url, { method = 'GET', headers = {}, body, insecure = false, timeout = 10000 } = {}) {
  const target = new URL(url)
  const transport = target.protocol === 'https:' ? https : http

  return new Promise((resolve, reject) => {
    const req = transport.request(
      target,
      {
        method,
        headers,
        rejectUnauthorized: !insecure,
        timeout,
      },
      (res) => {
        const chunks = []
        res.on('data', (chunk) => chunks.push(chunk))
        res.on('end', () => {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            buffer: Buffer.concat(chunks),
            get text() {
              return Buffer.concat(chunks).toString('utf8')
            },
          })
        })
      },
    )

    req.on('error', reject)
    req.on('timeout', () => req.destroy(new Error(`Request to ${target.host} timed out after ${timeout}ms`)))
    if (body) req.write(body)
    req.end()
  })
}

export async function getJson(url, options = {}) {
  const res = await request(url, options)
  if (res.status < 200 || res.status >= 300) {
    const err = new Error(`${options.method || 'GET'} ${url} failed with ${res.status}`)
    err.status = res.status
    err.body = res.text.slice(0, 400)
    throw err
  }
  try {
    return JSON.parse(res.text)
  } catch {
    throw new Error(`Response from ${url} was not valid JSON`)
  }
}
