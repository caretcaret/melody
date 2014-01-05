var _ = require('underscore'),
  path = require('path');

global = {
  root: path.normalize(__dirname + '/../'),
  app: {
    name: 'Melody'
  }
};

development = {
  db: {
    db: 'melody-dev',
    host: 'localhost'
  },
  port: 3000,
  secret: 'development',
};

test = {
  db: {
    db: 'melody-test',
    host: 'localhost'
  },
  port: 3000,
  secret: 'testing'
};

production = {
  db: {
    db: 'melody',
    host: 'localhost'
  },
  port: 80,
  secret: 'production' // change to actual secret
};


module.exports = {
  development: _.extend({}, global, development),
  test: _.extend({}, global, test),
  production: _.extend({}, global, production)
};
