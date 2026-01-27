import { expect } from 'chai';
import { validateCodeRequest, buildPromptMessage, createOllamaPayload, processOllamaStream } from '../utils/ollamaService.js';

describe('ollamaService utils', () => {
  describe('validateCodeRequest', () => {
    it('throws when code or language missing', () => {
      expect(() => validateCodeRequest(null, 'js')).to.throw();
      expect(() => validateCodeRequest('const a=1', null)).to.throw();
    });

    it('does not throw with valid input', () => {
      expect(() => validateCodeRequest('const a=1', 'javascript')).to.not.throw();
    });
  });

  describe('buildPromptMessage', () => {
    it('includes the code and language in the message content', () => {
      const code = 'function sum(a,b){return a+b}';
      const language = 'javascript';
      const messages = buildPromptMessage(code, language);
      expect(messages).to.be.an('array').that.is.not.empty;
      const msg = messages[0];
      expect(msg.role).to.equal('user');
      expect(msg.content).to.include(language);
      expect(msg.content).to.include(code);
    });
  });

  describe('createOllamaPayload', () => {
    it('sets model and streaming flags', () => {
      const payload = createOllamaPayload([{ role: 'user', content: 'hi' }], 'mistral-7b');
      expect(payload).to.include.keys('model', 'messages', 'stream');
      expect(payload.model).to.equal('mistral-7b');
      expect(payload.stream).to.be.true;
    });
  });

  describe('processOllamaStream', () => {
    it('accumulates tokens and calls onToken for each chunk', async () => {
      // Create a mock response with body as an async iterable yielding NDJSON-like chunks
      async function* gen() {
        // yield two chunks that simulate Ollama NDJSON lines
        yield Buffer.from(JSON.stringify({ message: { content: 'Hello ' } }) + '\n');
        yield Buffer.from(JSON.stringify({ message: { content: 'world' }, done: true }) + '\n');
      }

      const mockResponse = { body: gen() };
      const tokens = [];
      const full = await processOllamaStream(mockResponse, (t) => tokens.push(t));
      expect(tokens.join('')).to.equal('Hello world');
      expect(full).to.equal('Hello world');
    });
  });
});
