import request from 'supertest';
import { app } from '../server.js';
import { expect } from 'chai';

describe('Health', () => {
  it('GET / should return 200', async () => {
    const res = await request(app).get('/');
    expect(res.status).to.equal(200);
    expect(res.text).to.match(/Server is running|Backend running/);
  });
});
