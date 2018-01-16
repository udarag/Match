var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var session = require('express-session');
var expressValidator = require('express-validator');
var flash = require('connect-flash');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var hbs = require('express-handlebars');
var bcrypt = require('bcrypt');
var http = require('http');
var socketio = require('socket.io');


var index = require('./routes/index');
var users = require('./routes/users');

var app = express();

//S Socket server created
// var socketServer = http.createServer(app);
var io = socketio();

app.io = io;

var game = require('./routes/game')(io);


// /* Listen for socket connection on port 3002 */
// socketServer.listen(3002, function(){
//   console.log('Socket server listening on : 3002');
// });

if(process.env.NODE_ENV === 'development') {
 require("dotenv").config();
 console.log(process.env.NODE_ENV);
}

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.engine('handlebars', hbs({extname: 'handlebars', defaultLayout: 'layout', layoutsDir: 'views'}));
app.set('view engine', 'handlebars');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser(''));

// set static folder
app.use(express.static(path.join(__dirname, 'public')));

// Express Session
app.use(session({
    // store: new (require('connect-pg-simple')(session))(),
    secret: (process.env.SECRET_KEY || 'secret'),
    saveUninitialized: false,
    resave: false,
    // cookie: { secure: false }
}));

// Passport init 
app.use(passport.initialize());
app.use(passport.session());

// Express Validator
app.use(expressValidator({
  errorFormatter: function(param, msg, value) {
      var namespace = param.split('.')
      , root    = namespace.shift()
      , formParam = root;

    while(namespace.length) {
      formParam += '[' + namespace.shift() + ']';
    }
    return {
      param : formParam,
      msg   : msg,
      value : value
    };
  }
}));

// Connect Flash
// app.use(flash());

// // Global Vars
app.use(function(req, res, next) {
  res.locals.isAuthenticated = req.isAuthenticated();
  res.locals.user = req.user || null;
  res.locals.environment = process.env.NODE_ENV;
  next();
});

app.use('/', index);
app.use('/users', users);
app.use('/game', game);

var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

//passport local db check init
passport.use(new LocalStrategy(
  function(username, password, done) {
    console.log(username);
    console.log(password);
    const db = require('./db/index');


    db.any('SELECT username, id, password FROM users WHERE username = $1', [username])
        .then(function(data) {
            // success;
            // console.log(data);
            if (data.length == 0) {
              console.log('no match');
              return done(null, false, {message: 'Invalid Login'});
            }
            console.log('username match');
            const hash = data[0].password.toString();
            bcrypt.compare(password, hash, function(err, response) {
              if (response == true){
                return done(null, data[0]);
              }
              return done(null, false);
            });
        })
        .catch(function(error) {
            // error;
            return done(error, false);
        });
  }
));

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
