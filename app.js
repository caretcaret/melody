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
  _ = require('underscore'),
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
// compress responses with gzip/deflate
app.use(express.compress());
// safer bodyParser
app.use(express.json());
app.use(express.urlencoded());
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
  store: new MongoStore(config.db)
}));
// authentication
app.use(passport.initialize());
app.use(passport.session());
// prevent CSRF attacks
app.use(express.csrf());
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
})

// csrf route middleware; place before controller function to use
function generate_csrf(req, res, next) {
  res.locals.token = req.csrfToken();
  return next();
}

app.get('/', function(req, res) {
  var texts = [
    'Pretty notes for fun and profit.',
    'Your mom wishes you were this good.',
    'This is what freedom sounds like.',
    'Better than bitcoin.',
    'We collect all your data and then give it back to you.'
  ];
  var text = texts[Math.floor(Math.random() * texts.length)];
  res.render('home', {text: text});
});
app.get('/register', generate_csrf, function(req, res) {
  res.render('register', {title: 'register'});
});
app.post('/register', generate_csrf, function(req, res) {
  req.body.email = req.body.email.toLowerCase();
  req.sanitize('name').trim();
  req.sanitize('email').trim();
  req.checkBody('name', 'required').notEmpty();
  req.checkBody('email', 'not an email address').isEmail();
  req.checkBody('password', 'required').notNull();
  var errors = req.validationErrors(true);

  User.count({ email: req.body.email }, function(err, count) {
    if (count === 0) {
      if (_.size(errors)) {
        // there are validator errors, rerender to register page.
        res.render('register', {title: 'register', errors: errors});
      } else {
        // no errors; populate db, login, and redirect
        // TODO
        var user = new User({
          name: req.body.name,
          email: req.body.email
        });
        user.setPassword(req.body.password, function(err) {
          if (err) {
            console.log("[ERROR] could not set user's password: " + err);
            req.flash('error', 'Error: ' + err);
            return res.redirect('/');
          } else {
            user.save(function(err) {
              if (err) {
                console.log("[ERROR] cannot save user to MongoDB: " + err);
                req.flash('error', 'Error: ' + err);
                return res.redirect('/');
              } else {
                req.login(user, function(err) {
                  if (err) {
                    console.log("[ERROR] cannot log user in: " + err);
                    req.flash('error', 'Error: ' + err);
                    return res.redirect('/');
                  } else {
                    return res.redirect('/notes');
                  }
                });
              }
            });
          }
        });
      }
    } else {
      errors = errors || {};
      errors.email = {
        param: 'email',
        msg: 'this address is already registered',
        value: req.body.email
      }
      // there is at least one error, rerender register page.
      res.render('register', {title: 'register', errors: errors});
    }
  });

});
app.get('/login', generate_csrf, function(req, res) {
  res.render('login', {title: 'login'});
});
app.post('/login',
  passport.authenticate('local', { failureRedirect: '/login' }),
  generate_csrf,
  function(req, res) {
  res.redirect('/');
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
