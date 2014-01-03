var express = require('express'),
  slash = require('express-slash'),
  exphbs = require('express3-handlebars'),
  mongoose = require('mongoose'),
  MongoStore = require('connect-mongo')(express),
  env = process.env.NODE_ENV || 'development',
  config = require('./config/config')[env];

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

app.use(express.logger('dev'));
app.use(express.compress());
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());

app.use(express.cookieParser());
app.use(express.session({
  secret: config.secret,
  maxAge: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7),
  store: new MongoStore(config.db)
}));

app.enable('strict routing');
app.use(app.router);
app.use(slash());
app.use(express.static(config.root + '/public'));

if (env === 'development' || env === 'test') {
  app.use(express.errorHandler({
    dumpExceptions: true,
    showStack: true
  }));
} else if (env === 'production') {
  app.use(express.errorHandler());
}

app.get('/', function(req, res) {
  res.render('home', {text: 'hello world'});
});


function dburl(dbobj) {
  return 'mongodb://' + dbobj.host + '/' + dbobj.db;
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