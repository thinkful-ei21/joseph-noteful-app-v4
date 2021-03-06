'use strict';

const app = require('../server');
const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const { TEST_MONGODB_URI } = require('../config');

const User = require('../models/user');

const expect = chai.expect;

chai.use(chaiHttp);

describe('Noteful API - Users', function () {
  const username = 'exampleUser';
  const password = 'examplePass';
  const fullname = 'Example User';
  const username2 = 'exampleUser2';
  const password2 = 'examplePass2';
  const fullname2 = 'Example User2';

  before(function () {
    return mongoose.connect(TEST_MONGODB_URI)
      .then(() => mongoose.connection.db.dropDatabase());
  });

  beforeEach(function () {
    return User.createIndexes();
  });

  afterEach(function () {
    return mongoose.connection.db.dropDatabase();
  });

  after(function () {
    return mongoose.disconnect();
  });
  
  describe('/api/users', function () {
    describe('POST', function () {
      it('Should create a new user', function () {

        let res;
        return chai
          .request(app)
          .post('/api/users')
          .send({ fullname, username, password })
          .then(_res => {
            res = _res;
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'username', 'fullname');

            expect(res.body.id).to.exist;
            expect(res.body.username).to.equal(username);
            expect(res.body.fullname).to.equal(fullname);

            return User.findOne({ username });
          })
          .then(user => {
            expect(user).to.exist;
            expect(user.id).to.equal(res.body.id);
            expect(user.fullname).to.equal(fullname);
            return user.validatePassword(password);
          })
          .then(isValid => {
            expect(isValid).to.be.true;
          });
      });
      it('Should reject users with missing username', function () {
        return chai
          .request(app)
          .post('/api/users')
          .send({ fullname, password })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Missing \'username\' in request body');
          });
      });

      /**
       * COMPLETE ALL THE FOLLOWING TESTS
       */
      it('Should reject users with missing password', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({ fullname, username })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Missing \'password\' in request body');
          });
      });

      it('Should reject users with non-string username', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username: 123,
            password
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Incorrect field type: expected string');
          });
      });

      it('Should reject users with non-string password', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username,
            password: 123
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Incorrect field type: expected string');
          });
      });

      it('Should reject users with non-trimmed username', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username: ' joe ',
            password
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
          });
      });

      it('Should reject users with non-trimmed password', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username,
            password: ' password '
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.message).to.equal('Cannot start or end with whitespace');
          });
      });

      it('Should reject users with empty username', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username: '',
            password
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Must be at least 1 characters long');
          });
      });

      it('Should reject users with password less than 8 characters', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username,
            password: '1'
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Must be at least 8 characters long');
          });
      });

      it('Should reject users with password greater than 72 characters', function() {

        function passwordGen() {
          let pass = '';
          for (let i = 0; i <= 80; i++) {
            let character = 'a';
            pass += character;
          }
          return pass;
        }

        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname,
            username,
            password: passwordGen()
          })
          .then(res => {
            expect(res).to.have.status(422);
            expect(res.body.reason).to.equal('ValidationError');
            expect(res.body.message).to.equal('Must be at most 72 characters long');
          });
      });

      it('Should reject users with duplicate username', function() {
        return User.create({
          fullname,
          username,
          password
        })
          .then(() => {
            return chai
              .request(app)
              .post('/api/users')
              .send({
                fullname,
                username,
                password
              })
              .then(res => {
                expect(res).to.have.status(400);
                expect(res.body.message).to.equal('The username already exists');
              });
          });
      });

      it('Should trim fullname', function() {
        return chai
          .request(app)
          .post('/api/users')
          .send({
            fullname: ' Example User ',
            username,
            password
          })
          .then(res => {
            expect(res).to.have.status(201);
            expect(res.body).to.be.an('object');
            expect(res.body).to.have.keys('id', 'fullname', 'username');
            expect(res.body.fullname).to.equal(fullname);
          });
      });

    });
  });
});