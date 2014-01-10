var express = require('express'),
  slash = require('express-slash'),
  exphbs = require('express3-handlebars'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  MongoStore = require('connect-mongo')(express),
  sass = require('node-sass'),
  flash = require('connect-flash'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  expressValidator = require('express-validator'),
  env = process.env.NODE_ENV || 'development',
  config = require('./config')[env],
  parted = require('parted'),
  mkdirp = require('mkdirp'),
  User = require('./models/user'),
  passportSocketIo = require("passport.socketio"),
  cstore = new MongoStore(config.db);

// create and configure express app
var app = express();

// use handlebar templates with extension .html
var hbs = exphbs.create({
  defaultLayout: 'main',
  extname: '.html',
  helpers: {}
});
app.engine('html', hbs.engine);
app.set('view engine', 'html');

app.set('port', config.port);
app.set('title', config.app.name);

// middlewares
app.use(express.logger('dev'));

// compress responses with gzip/deflate
app.use(express.compress());

// parsing requests
app.use(parted(config.parted));

// make sure the uploads folder exists
mkdirp(config.parted.path);

// pretend RESTful http methods are POSTs
app.use(express.methodOverride());

// validation
app.use(expressValidator());
// cookies
app.use(express.cookieParser());

// use MongoDB to hold session data
app.use(express.session({
  secret: config.cookie.secret,
  maxAge: config.cookie.maxAge,
  store: cstore
}));

// authentication
app.use(passport.initialize());
app.use(passport.session());

// prevent CSRF attacks
app.use(express.csrf());
// generate token for handlebars on every request
app.use(function(req, res, next) {
  res.locals.token = req.csrfToken();
  return next();
});

// access config from templates
app.use(function(req, res, next) {
  res.locals.config = config;
  return next();
});

// flash message support
app.use(flash());

// have slashes in URIs be significant
app.enable('strict routing');
app.use(app.router);
app.use(slash());

// set up node-sass to compile and serve any uncompiled scss
app.use(sass.middleware({
  src: config.root,
  dest: config.root + '/public',
  debug: true,
  outputStyle: 'compressed'
}));

// serve static files from /public
app.use(express.static(config.root + '/public'));

if (env === 'development' || env === 'test') {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
} else if (env === 'production') {
  app.use(express.errorHandler());
}

// passport local authentication
passport.use(new LocalStrategy({
  // the fields that will be used in the forms
    usernameField: 'email',
    passwordField: 'password'
  },
  function(email, password, done) {
    User.findOne({ email: email}, function(err, user) {
      if (err) {
        return done(err);
      }
      if (!user) {
        return done(null, false, {
          error: 'Email address ' + email + ' does not exist.'
        });
      }
      user.verifyPassword(password, function(result) {
        if (!result) {
          return done(null, false, {
            error: "Password is incorrect for " + email + "."
          });
        } else {
          return done(null, user);
        }
      });
    });
  }
));

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findOne({ _id: ObjectId(id) }, function(err, user) {
    done(err, user);
  });
});

// attach routes and controllers
require('./controllers/main')(app);

function dburl(options) {
  return 'mongodb://' + options.host + '/' + options.db;
}

mongoose.connect(dburl(config.db));
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log("Database connection open");
  var server = require('http').createServer(app);
  var io = require('socket.io').listen(server);
  var acceptConnection = function(data, accept) {
    accept(null, true);
  };
  var rejectConnection = function(data, message, error, accept) {
    if (error) {
      console.error("Rejected connection: " + error);
    }
    accept(null, false);
  };

  io.set('authorization', passportSocketIo.authorize({
    cookieParser: express.cookieParser,
    secret: config.cookie.secret,
    store: cstore,
    success: acceptConnection,
    fail: rejectConnection
  }));

  // socket.io behavior in ./controllers/realtime.js
  require('./controllers/realtime')(io);

  server.listen(app.get('port'));
  console.log("Web server listening on port " + app.get('port'));
});


exports = module.exports = app;
