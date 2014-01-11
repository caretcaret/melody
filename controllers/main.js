var User = require('../models/user'),
  Note = require('../models/note'),
  _ = require('underscore'),
  passport = require('passport');

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

module.exports = function(app) {
  app.get('/', optionalAuth, function(req, res) {
    var texts = [
      "Pretty notes for fun and profit.",
      "Your mom wishes you were this good.",
      "This is what freedom sounds like.",
      "Better than bitcoin.",
      "We collect all your data and then give it back to you. And you'll like it.",
      "Now with 200% more kittens.",
      "5 out of 5 dentists recommend it.",
      "sudo rm -rf /",
      "It's like drinking all night and not waking up with a hangover.",
      "Well, what are you waiting for?",
      "1110111110010111011001100011110111111011011100101100001"
    ];
    var text = texts[Math.floor(Math.random() * texts.length)];
    res.render('home', {text: text, errors: req.flash('error')});
  });
  app.get('/register', optionalAuth, function(req, res) {
    res.render('register', {title: 'Register'});
  });
  app.post('/register', function(req, res) {
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
  app.get('/login', optionalAuth, function(req, res) {
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
  app.get('/notes', requireAuth, function(req, res) {
    Note.lookupByUserId(req.user._id, function(err,userNotes){
      if (err) {
        console.log("[ERROR] could not set user's password: " + err);
        req.flash('error', err);
        return res.redirect('/');
      } else {
        res.render('notes', {
          layout: 'notes_ui',
          title: 'Notes',
          errors: req.flash('error'),
          notes: userNotes
        });
      }
    });
  });
  app.post('/logout', function(req, res) {
    req.logout();
    res.redirect('/');
  });
  app.get('/terms', optionalAuth, function(req, res) {
    res.render('terms', {title: 'Terms of Service'});
  });
  app.post('/upload', requireAuth, function(req, res){
    console.log(req.files);
    res.redirect('/notes');
  });
  app.get('/images/:id', optionalAuth, function(req,res){
    Note.lookupImageById(req.params.id, function(err, data){
      if (err) {
        console.log("[ERROR] could not set user's password: " + err);
        req.flash('error', err);
        return res.redirect('/');
      }
      else {

        //TODO: get this to work. for some reason the image doesn't show up

        res.set('Content-Type', data.attachments[0].mimetype);
        res.send(new Buffer(data.attachments[0].binary, 'binary'));
      }
    });
  });
};