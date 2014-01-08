var _ = require('underscore'),

global = {
  root: __dirname,
  app: {
    name: 'melody'
  },
  scrypt: {
    maxtime: 0.1
  }
};

development = {
  db: {
    db: 'melody-dev',
    host: 'sgre.co'
  },
  port: 3000,
  cookie: {
    secret: 'development',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

test = {
  db: {
    db: 'melody-test',
    host: 'localhost'
  },
  port: 3000,
  cookie: {
    secret: 'testing',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};

production = {
  db: {
    db: 'melody',
    host: 'localhost'
  },
  port: 80,
  cookie: {
    secret: 'production', // change to actual secret
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
};


module.exports = {
  development: _.extend({}, global, development),
  test: _.extend({}, global, test),
  production: _.extend({}, global, production)
};
