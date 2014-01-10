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
    host: 'localhost'
  },
  host: 'http://localhost',
  port: 3000,
  cookie: {
    secret: 'development',
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
  parted: {
    path: __dirname + '/upload',
    limit: 30 * 1024,
    diskLimit: 30 * 1024 * 1024,
    stream: true
  },
  socket: {
    logLevel: 2
  }
};

test = {
  db: {
    db: 'melody-test',
    host: 'localhost'
  },
  host: 'http://localhost',
  port: 3000,
  cookie: {
    secret: 'testing',
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
  parted: {
    path: __dirname + '/upload',
    limit: 30 * 1024,
    diskLimit: 30 * 1024 * 1024,
    stream: true
  },
  socket: {
    logLevel: 1
  }
};

production = {
  db: {
    db: 'melody',
    host: 'localhost'
  },
  host: 'http://localhost',
  port: 80,
  cookie: {
    secret: 'production', // change to actual secret
    maxAge: 1000 * 60 * 60 * 24 * 7
  },
  parted: {
    path: __dirname + '/upload',
    limit: 30 * 1024,
    diskLimit: 30 * 1024 * 1024,
    stream: true
  },
  socket: {
    logLevel: 0
  }
};


module.exports = {
  development: _.extend({}, global, development),
  test: _.extend({}, global, test),
  production: _.extend({}, global, production)
};
