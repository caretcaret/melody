var express = require('express'),
  fs = require('fs'),
  slash = require('express-slash'),
  exphbs = require('express3-handlebars'),
  mongoose = require('mongoose'),
  ObjectId = mongoose.Types.ObjectId,
  MongoStore = require('connect-mongo')(express),
  sass = require('node-sass'),
  flash = require('connect-flash'),
  passport = require('passport'),
  LocalStrategy = require('passport-local').Strategy,
  env = process.env.NODE_ENV || 'development',
  config = require('./config')[env],
  User = require('./models/user');

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
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(express.cookieParser());
// use MongoDB to hold session data
app.use(express.session({
  secret: config.cookie.secret,
  maxAge: config.cookie.maxAge,
  store: new MongoStore(config.db)
}));
// prevent CSRF attacks
app.use(express.csrf());
// flash message support
app.use(flash());

app.enable('strict routing');
app.use(app.router);
// have slashes in URIs be significant
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
passport.use(new LocalStrategy(
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
      if (!user.verifyPassword(password)) {
        return done(null, false, {
          error: 'Password is incorrect.'
        });
      }
      return done(null, user);
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
})

// csrf route middleware; place before controller function to use
function csrf(req, res, next) {
  res.locals.token = req.csrfToken();
  next();
}

app.get('/', function(req, res) {
  var texts = [
    'Pretty notes for fun and profit.',
    'Your mom wishes you were this good.',
    'This is what freedom sounds like.',
    'Better than bitcoin.'
  ];
  var text = texts[Math.floor(Math.random() * texts.length)];
  res.render('home', {text: text, title: 'home'});
});
app.get('/register', csrf, function(req, res) {
  res.render('register', {title: 'register'});
});
app.get('/page/:name', function(req, res) {
  res.render('page', {});
});
app.get('/terms', function(req, res) {
  res.render('terms', {title: 'terms of service'});
});

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
  server.listen(app.get('port'));
  console.log("Web server listening on port " + app.get('port'));
});


exports = module.exports = app;