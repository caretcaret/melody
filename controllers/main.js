var User = require('../models/user'),
  _ = require('underscore'),
  passport = require('passport'),
  multipart = require('parted').multipart;

// use for routes that require authentication; user is automatically
// added to handlebars vars.
function requireAuth(req, res, next) {
  if (!req.isAuthenticated()) {
    req.flash('error', 'Please log in or register.');
    return res.redirect('/');
  }
  res.locals.user = req.user;
  next();
}

// populates handlebars local vars with user, if logged in.
function optionalAuth(req, res, next) {
  if (req.isAuthenticated()) {
    res.locals.user = req.user;
  }
  return next();
}

// csrf route middleware; place before controller function to use
function generateToken(req, res, next) {
  res.locals.token = req.csrfToken();
  return next();
}

module.exports = function(app) {
  app.get('/', generateToken, optionalAuth, function(req, res) {
    var texts = [
      "Pretty notes for fun and profit.",
      "Your mom wishes you were this good.",
      "This is what freedom sounds like.",
      "Better than bitcoin.",
      "We collect all your data and then give it back to you. And you'll like it.",
      "Now with 200% more kittens.",
      "5 out of 5 dentists recommend it."
    ];
    var text = texts[Math.floor(Math.random() * texts.length)];
    res.render('home', {text: text, errors: req.flash('error')});
  });
  app.get('/register', generateToken, optionalAuth, function(req, res) {
    res.render('register', {title: 'Register'});
  });
  app.post('/register', generateToken, function(req, res) {
    req.body.email = req.body.email.toLowerCase();
    req.sanitize('name').trim();
    req.sanitize('email').trim();
    req.checkBody('name', 'A name is required.').notEmpty();
    req.checkBody('email', 'Your email address is invalid.').isEmail();
    req.checkBody('password', 'A password is required.').notNull();
    var errors = req.validationErrors(true);

    User.count({ email: req.body.email }, function(err, count) {
      if (count === 0) {
        if (_.size(errors)) {
          // there are validator errors, rerender to register page.
          res.render('register', {
            title: 'Register',
            errors: errors,
            values: req.body
          });
        } else {
          // no errors; populate db, login, and redirect
          var user = new User({
            name: req.body.name,
            email: req.body.email
          });
          user.setPassword(req.body.password, function(err) {
            if (err) {
              console.log("[ERROR] could not set user's password: " + err);
              req.flash('error', err);
              return res.redirect('/');
            } else {
              user.save(function(err) {
                if (err) {
                  console.log("[ERROR] cannot save user to MongoDB: " + err);
                  req.flash('error', err);
                  return res.redirect('/');
                } else {
                  req.login(user, function(err) {
                    if (err) {
                      console.log("[ERROR] cannot log user in: " + err);
                      req.flash('error', err);
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
          msg: 'This email address is already registered.',
          value: req.body.email
        };
        // there is at least one error, rerender register page.
        res.render('register', {
          title: 'Register',
          errors: errors,
          values: req.body
        });
      }
    });

  });
  app.get('/login', generateToken, function(req, res) {
    var errors = req.flash('error');
    res.render('login', {
      title: 'Log in',
      errors: errors
    });
  });
  app.post('/login',
    passport.authenticate('local', {
      successRedirect: '/notes',
      failureRedirect: '/login',
      failureFlash: 'Invalid username or password.'
    }));
  app.get('/notes', generateToken, requireAuth, function(req, res) {
    res.render('notes');
  });
  app.post('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
  app.get('/terms', generateToken, optionalAuth, function(req, res) {
    res.render('terms', {title: 'Terms of Service'});
  });
  app.post('/upload', requireAuth, function(req, res){
    console.log(req.files);
    res.redirect('/notes');
  });
};