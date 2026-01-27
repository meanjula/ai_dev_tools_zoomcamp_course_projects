import request from 'supertest';
// We'll import `app` after setting NODE_ENV to 'test' to avoid DB lookups during initialization
import { expect } from 'chai';

// Helper: create a fake fetch response with async iterable body
function makeStreamResponse(lines, delay = 0) {
  async function* gen() {
    for (const line of lines) {
      // simulate chunk bytes
      const chunk = new TextEncoder().encode(line + '\n');
      if (delay) await new Promise((r) => setTimeout(r, delay));
      yield chunk;
    }
  }
  return { body: gen(), ok: true, status: 200 };
}

describe('Explain endpoint (mocked Ollama)', () => {
  let originalFetch;
  let app;

  before(async () => {
    // Ensure server runs in test mode so it skips DB user lookups
    process.env.NODE_ENV = 'test';
    // stub global fetch used by ollamaService
    originalFetch = global.fetch;
    global.fetch = async (url, opts) => {
      // Verify correct URL
      if (url.includes('/api/chat')) {
        // Simulate NDJSON tokens
        const lines = [
          JSON.stringify({ choices: [{ delta: { content: 'This function ' } }] }),
          JSON.stringify({ choices: [{ delta: { content: 'adds two numbers.' } }] }),
          JSON.stringify({ done: true }),
        ];
        return makeStreamResponse(lines);
      }
      return { ok: false, status: 404 };
    };

    // Import the app after setting NODE_ENV
    const srv = await import('../server.js');
    app = srv.app;
  });

  after(() => {
    global.fetch = originalFetch;
  });

  it('POST /api/explain-code should stream NDJSON tokens and finish with done', async function () {
    this.timeout(5000);

    const res = await request(app)
      .post('/api/explain-code')
      .send({ code: 'function add(a,b){return a+b}', language: 'javascript', userId: 'test-user' })
      .set('Accept', 'application/json')
      .buffer(true)
      .parse((res, callback) => {
        // accumulate raw text
        let data = '';
        res.on('data', (chunk) => {
          data += chunk.toString();
        });
        res.on('end', () => callback(null, data));
      });

    expect(res.status).to.equal(200);
    // The response should contain token lines and a done line (NDJSON)
    const body = res.text ?? res.body ?? '';
    expect(body).to.include('"type":"token"');
    expect(body).to.include('"type":"done"');
  });
});
