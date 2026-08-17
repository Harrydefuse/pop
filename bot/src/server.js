/**
 * Local HTTP + SSE bridge between the bot and a browser.
 *
 * A browser cannot read the bot's JSON files, so the dashboard talks to this.
 * Zero dependencies — node:http is enough for a handful of JSON routes and an
 * event stream.
 *
 * It binds to 127.0.0.1 by default and is intended to stay there: it exposes
 * portfolio state and can trigger a scan, with no authentication. Do not put it
 * on a public interface.
 */
import http from 'node:http';

import { readJsonl } from './store.js';
import { createIdeaService } from './ideas/service.js';
import { createAlertInbox } from './tradingview/index.js';
import { MAX_BODY_BYTES } from './tradingview/alerts.js';
import { ideaScript } from './ta/pine.js';
import { log } from './log.js';

const SSE_HEADERS = {
  'content-type': 'text/event-stream',
  'cache-control': 'no-cache, no-transform',
  connection: 'keep-alive',
  'x-accel-buffering': 'no',
};

/** Events forwarded verbatim from the runner to every connected client. */
const FORWARDED = [
  'cycle:start',
  'cycle:end',
  'cycle:error',
  'stage',
  'activity',
  'decisions',
  'position:open',
  'position:close',
  'started',
  'stopped',
  'waiting',
];

function sendJson(response, status, body) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
    // The Vite dev server runs on another port; allow it to read from here.
    'access-control-allow-origin': '*',
  });
  response.end(payload);
}

function sendText(response, status, body) {
  response.writeHead(status, {
    'content-type': 'text/plain; charset=utf-8',
    'content-length': Buffer.byteLength(body),
    'access-control-allow-origin': '*',
  });
  response.end(body);
}

/**
 * Read a request body with a hard ceiling.
 *
 * The cap is enforced while streaming, not after: buffering an unbounded body
 * and then measuring it is how a single request exhausts memory on a host that
 * is, by necessity, exposed to the internet for this endpoint to work at all.
 */
function readBody(request, limit) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    request.on('data', (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error('body too large'));
        request.destroy();
        return;
      }
      chunks.push(chunk);
    });
    request.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    request.on('error', reject);
  });
}

/** Query parameters a client may use to shape an ideas run. */
function ideaOptions(url) {
  const symbols = url.searchParams.get('symbols');
  const top = Number(url.searchParams.get('top'));
  return {
    interval: url.searchParams.get('interval') ?? '4h',
    contains: url.searchParams.get('contains') ?? '',
    ...(symbols ? { symbols: symbols.split(',').map((symbol) => symbol.trim().toUpperCase()).filter(Boolean) } : {}),
    // Clamped, not trusted: `explainTop` is a count of billable model calls and
    // this endpoint has no authentication.
    ...(Number.isFinite(top) && top > 0 ? { explainTop: Math.min(top, 10) } : {}),
  };
}

export function createServer(runner, { allowControl = true, ideas, inbox } = {}) {
  const ideaService = ideas ?? createIdeaService(runner.config);
  const alertInbox = inbox ?? createAlertInbox(runner.config);

  /** @type {Set<import('node:http').ServerResponse>} */
  const clients = new Set();

  const broadcast = (event, data) => {
    if (clients.size === 0) return;
    const frame = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    for (const client of clients) {
      // A slow or dead client must never take down the runner.
      try {
        client.write(frame);
      } catch {
        clients.delete(client);
      }
    }
  };

  for (const event of FORWARDED) {
    runner.on(event, (payload) => broadcast(event, payload ?? {}));
  }

  alertInbox.events.on('alert', (alert) => broadcast('tradingview:alert', alert));

  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://localhost');
    const route = url.pathname;

    if (request.method === 'OPTIONS') {
      response.writeHead(204, {
        'access-control-allow-origin': '*',
        'access-control-allow-methods': 'GET, POST, OPTIONS',
        'access-control-allow-headers': 'content-type',
      });
      response.end();
      return;
    }

    try {
      if (route === '/api/health') {
        sendJson(response, 200, { ok: true, uptimeSeconds: Math.round(process.uptime()) });
        return;
      }

      if (route === '/api/state') {
        sendJson(response, 200, {
          ...runner.summary(),
          feed: runner.feed.slice(0, Number(url.searchParams.get('feed') ?? 40)),
          activity: runner.activity.slice(0, 30),
          equity: runner.equityHistory({ limit: 500 }),
        });
        return;
      }

      if (route === '/api/equity') {
        sendJson(response, 200, runner.equityHistory({ limit: Number(url.searchParams.get('limit') ?? 500) }));
        return;
      }

      if (route === '/api/decisions') {
        sendJson(response, 200, runner.feed.slice(0, Number(url.searchParams.get('limit') ?? 60)));
        return;
      }

      if (route === '/api/positions') {
        sendJson(response, 200, runner.portfolio.openPositions);
        return;
      }

      if (route === '/api/trades') {
        const limit = Number(url.searchParams.get('limit') ?? 50);
        sendJson(response, 200, runner.portfolio.state.closed.slice(-limit).reverse());
        return;
      }

      if (route === '/api/signals') {
        const limit = Number(url.searchParams.get('limit') ?? 200);
        sendJson(response, 200, readJsonl(runner.config.dataDirAbsolute, 'signals.jsonl', { limit }).reverse());
        return;
      }

      // The one route the outside world is meant to reach. Everything it needs
      // to defend itself lives in the inbox; the server's job is to hand it the
      // body and the peer address and get out of the way.
      if (route === '/api/tradingview' && request.method === 'POST') {
        readBody(request, MAX_BODY_BYTES)
          .then((body) => {
            const result = alertInbox.receive(body, { address: request.socket.remoteAddress });
            sendJson(response, result.status, result.body);
          })
          .catch(() => sendJson(response, 413, { error: 'body too large' }));
        return;
      }

      if (route === '/api/tradingview/alerts') {
        sendJson(response, 200, {
          ...alertInbox.stats,
          alerts: alertInbox.recent.slice(0, Number(url.searchParams.get('limit') ?? 50)),
        });
        return;
      }

      // Stale-while-revalidate: a scan costs one candle request per symbol and
      // up to `explainTop` model calls, so a cached list is served immediately
      // and refreshed behind the response. Only a cold cache makes anyone wait.
      if (route === '/api/ideas') {
        const snapshot = ideaService.peek();
        if (snapshot) {
          if (snapshot.stale) ideaService.refresh(ideaOptions(url));
          sendJson(response, 200, { ...snapshot, running: ideaService.running, error: ideaService.lastError });
          return;
        }
        ideaService.get(ideaOptions(url)).then(
          (result) => sendJson(response, 200, { ...result, running: false, error: null }),
          (error) => sendJson(response, 503, { error: error.message, ideas: [], scanned: 0 }),
        );
        return;
      }

      // The Pine script for one cached idea, ready to paste into TradingView.
      if (route === '/api/ideas/pine') {
        const symbol = (url.searchParams.get('symbol') ?? '').toUpperCase();
        const idea = ideaService.peek()?.ideas.find((entry) => entry.symbol === symbol);
        if (!idea) {
          sendJson(response, 404, { error: `no cached idea for ${symbol || '(no symbol given)'}` });
          return;
        }
        sendText(response, 200, ideaScript(idea));
        return;
      }

      if (route === '/api/ideas/scan' && request.method === 'POST') {
        if (!allowControl) {
          sendJson(response, 403, { error: 'control endpoints disabled' });
          return;
        }
        const started = ideaService.refresh({ ...ideaOptions(url), force: true });
        sendJson(response, 202, { accepted: true, started, alreadyRunning: !started });
        return;
      }

      if (route === '/api/scan' && request.method === 'POST') {
        if (!allowControl) {
          sendJson(response, 403, { error: 'control endpoints disabled' });
          return;
        }
        // Fire and forget — the client watches the event stream for progress.
        runner.runOnce();
        sendJson(response, 202, { accepted: true });
        return;
      }

      if (route === '/api/stream') {
        response.writeHead(200, { ...SSE_HEADERS, 'access-control-allow-origin': '*' });
        response.write(`event: snapshot\ndata: ${JSON.stringify(runner.summary())}\n\n`);
        clients.add(response);

        // Proxies and browsers drop idle streams; a comment every 20s keeps it open.
        const heartbeat = setInterval(() => {
          try {
            response.write(': ping\n\n');
          } catch {
            clearInterval(heartbeat);
          }
        }, 20_000);

        request.on('close', () => {
          clearInterval(heartbeat);
          clients.delete(response);
        });
        return;
      }

      sendJson(response, 404, { error: `no route for ${route}` });
    } catch (error) {
      log.error('server error:', error.message);
      sendJson(response, 500, { error: error.message });
    }
  });

  server.on('close', () => {
    for (const client of clients) client.end();
    clients.clear();
  });

  return Object.assign(server, {
    get clientCount() {
      return clients.size;
    },
  });
}

export function startServer(runner, { port = 7331, host = '127.0.0.1' } = {}) {
  const server = createServer(runner);
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      log.info(`api listening on http://${host}:${server.address().port}`);
      resolve(server);
    });
  });
}
