var express = require('express');
var router = express.Router();
const db = require('../db/index');
var bcrypt = require('bcrypt');
var passport = require('passport');

const saltRounds = 10; 

/* GET users listing. */
router.get('/', function(req, res, next) {
  console.log(req.user.username);
  res.redirect('../');
});

/* Login get*/
router.get('/login', function(req, res) {
  res.render('login', { title: 'Match!' });
});

/* Logout get*/
router.get('/logout', function(req, res) {
  req.logout();
  req.session.destroy();
  res.redirect('../');
});

/* Register get*/
router.get('/register', function(req, res) {
  res.render('register', { title: 'Match!' });
});

/* Login post */
router.post('/login', passport.authenticate(
  'local', {
    successRedirect: '../profile',
    failureRedirect: '../users/register'
}));

/* Register post */
router.post('/register', function(req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var password2 = req.body.password2;

  //validation
  req.checkBody('username', 'Name is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  var errors = req.validationErrors();
  var user_id = null;

  if(errors){
    console.log('FORM FAIL username: ' + username);
    res.render('register',{title:'Match!', errors:errors});
  } else {
    bcrypt.hash(password, saltRounds, function(err, hash) {
      db.one(`INSERT INTO users (username, password) VALUES ($1,$2) RETURNING id`,
        [username, hash]).then(data => {
          user_id = data.id;
          req.login(user_id, function(err) {});
          res.redirect('../users/login');       
        });                 
    });  
  }
});

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user_id, done) {
    done(null, user_id);
});

module.exports = router;