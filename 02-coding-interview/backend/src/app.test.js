const request = require('supertest');
const { expect } = require('chai');
const app = require('./app');

describe('CodeCollab API', () => {
  let userId;
  let sessionId;

  describe('Health', () => {
    it('should return ok status', (done) => {
      request(app)
        .get('/api/health')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.status).to.equal('ok');
          expect(res.body.timestamp).to.exist;
          done();
        });
    });
  });

  describe('Users', () => {
    it('should create a user', (done) => {
      request(app)
        .post('/api/users')
        .send({ name: 'Alice' })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.id).to.exist;
          expect(res.body.name).to.equal('Alice');
          expect(res.body.color).to.match(/^#[0-9A-Fa-f]{6}$/);
          expect(res.body.created_at).to.exist;
          userId = res.body.id;
          done();
        });
    });

    it('should fail to create user with missing name', (done) => {
      request(app)
        .post('/api/users')
        .send({})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });

    it('should get user by id', (done) => {
      request(app)
        .get(`/api/users/${userId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.id).to.equal(userId);
          expect(res.body.name).to.equal('Alice');
          done();
        });
    });

    it('should return 404 for non-existent user', (done) => {
      request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });

    it('should update user', (done) => {
      request(app)
        .patch(`/api/users/${userId}`)
        .send({ name: 'Alice Updated' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.name).to.equal('Alice Updated');
          done();
        });
    });
  });

  describe('Sessions', () => {
    it('should create a session', (done) => {
      request(app)
        .post('/api/sessions')
        .send({ name: 'My Coding Session', language: 'javascript', userId })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.id).to.exist;
          expect(res.body.name).to.equal('My Coding Session');
          expect(res.body.language).to.equal('javascript');
          expect(res.body.owner.id).to.equal(userId);
          expect(res.body.participants).to.be.an('array').with.lengthOf(1);
          expect(res.body.code).to.exist;
          sessionId = res.body.id;
          done();
        });
    });

    it('should fail to create session with missing fields', (done) => {
      request(app)
        .post('/api/sessions')
        .send({ name: 'No Owner Session' })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });

    it('should fail to create session with non-existent user', (done) => {
      request(app)
        .post('/api/sessions')
        .send({
          name: 'Bad User',
          language: 'python',
          userId: '00000000-0000-0000-0000-000000000000'
        })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });

    it('should list sessions', (done) => {
      request(app)
        .get('/api/sessions')
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.sessions).to.be.an('array');
          expect(res.body.total).to.be.a('number');
          expect(res.body.limit).to.equal(10);
          expect(res.body.offset).to.equal(0);
          done();
        });
    });

    it('should get session by id', (done) => {
      request(app)
        .get(`/api/sessions/${sessionId}`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.id).to.equal(sessionId);
          expect(res.body.name).to.equal('My Coding Session');
          done();
        });
    });

    it('should return 404 for non-existent session', (done) => {
      request(app)
        .get('/api/sessions/00000000-0000-0000-0000-000000000000')
        .expect(404)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });

    it('should update session', (done) => {
      request(app)
        .patch(`/api/sessions/${sessionId}`)
        .send({ name: 'Updated Session Name' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.name).to.equal('Updated Session Name');
          done();
        });
    });

    it('should change session language', (done) => {
      request(app)
        .put(`/api/sessions/${sessionId}/language`)
        .send({ language: 'python' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.language).to.equal('python');
          expect(res.body.code).to.exist;
          done();
        });
    });
  });

  describe('Code Management', () => {
    it('should get current code', (done) => {
      request(app)
        .get(`/api/sessions/${sessionId}/code`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.code).to.exist;
          expect(res.body.language).to.equal('python');
          expect(res.body.lastModified).to.exist;
          done();
        });
    });

    it('should update code', (done) => {
      const newCode = "print('Hello World')";
      request(app)
        .put(`/api/sessions/${sessionId}/code`)
        .send({ code: newCode, userId })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.code).to.equal(newCode);
          expect(res.body.lastModified).to.exist;
          done();
        });
    });

    it('should fail to update code with missing code field', (done) => {
      request(app)
        .put(`/api/sessions/${sessionId}/code`)
        .send({ userId })
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });
  });

  describe('Collaboration', () => {
    let participantUserId;

    it('should create another user to join session', (done) => {
      request(app)
        .post('/api/users')
        .send({ name: 'Bob' })
        .expect(201)
        .end((err, res) => {
          if (err) return done(err);
          participantUserId = res.body.id;
          done();
        });
    });

    it('should join a session', (done) => {
      request(app)
        .post(`/api/sessions/${sessionId}/join`)
        .send({ userId: participantUserId })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.participants).to.be.an('array').with.lengthOf(2);
          expect(res.body.participants.map(p => p.id)).to.include(participantUserId);
          done();
        });
    });

    it('should get participants', (done) => {
      request(app)
        .get(`/api/sessions/${sessionId}/participants`)
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.participants).to.be.an('array').with.lengthOf(2);
          expect(res.body.count).to.equal(2);
          done();
        });
    });

    it('should update user presence', (done) => {
      request(app)
        .post(`/api/sessions/${sessionId}/presence`)
        .send({ userId: participantUserId, cursor: { line: 5, column: 12 } })
        .expect(204)
        .end(done);
    });

    it('should leave session', (done) => {
      request(app)
        .post(`/api/sessions/${sessionId}/leave`)
        .send({ userId: participantUserId })
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          // Verify participant was removed
          request(app)
            .get(`/api/sessions/${sessionId}/participants`)
            .expect(200)
            .end((err2, res2) => {
              if (err2) return done(err2);
              expect(res2.body.count).to.equal(1);
              done();
            });
        });
    });
  });

  describe('Code Execution', () => {
    it('should execute JavaScript code', (done) => {
      request(app)
        .post('/api/execute')
        .send({ code: "console.log('test')", language: 'javascript' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.output).to.equal('test');
          expect(res.body.executionTime).to.be.a('number');
          done();
        });
    });

    it('should handle execution errors', (done) => {
      request(app)
        .post('/api/execute')
        .send({ code: "throw new Error('test error')", language: 'javascript' })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          expect(res.body.error).to.include('test error');
          done();
        });
    });

    it('should fail with missing required fields', (done) => {
      request(app)
        .post('/api/execute')
        .send({})
        .expect(400)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.error).to.exist;
          done();
        });
    });

    it('should execute batch code', (done) => {
      request(app)
        .post('/api/execute/batch')
        .send({
          executions: [
            { id: '1', code: "console.log('first')", language: 'javascript' },
            { id: '2', code: "console.log('second')", language: 'javascript' }
          ]
        })
        .expect(200)
        .end((err, res) => {
          if (err) return done(err);
          expect(res.body.results).to.be.an('array').with.lengthOf(2);
          expect(res.body.results[0].id).to.equal('1');
          expect(res.body.results[0].result.output).to.equal('first');
          done();
        });
    });
  });

  describe('Session Deletion', () => {
    it('should delete a session', (done) => {
      request(app)
        .delete(`/api/sessions/${sessionId}`)
        .expect(204)
        .end((err, res) => {
          if (err) return done(err);
          // Verify session is deleted
          request(app)
            .get(`/api/sessions/${sessionId}`)
            .expect(404)
            .end(done);
        });
    });
  });
});
