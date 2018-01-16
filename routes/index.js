var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
	if (req.isAuthenticated() == true){
		res.redirect('/profile');
	} else {
		res.render('index', { title: 'Match!' });
	}   
});

/* GET profile page. */
router.get('/profile', function(req, res) {
	if (req.isAuthenticated() == false){
		res.redirect('../');
	} else {
		res.render('profile', { title: 'Match!', username: req.user.username });
	}   
});

/* GET about page. */
router.get('/about', function(req, res, next) {
  res.render('about', { title: 'Match!' });
});

function authenticationMiddleware () {  
	return (req, res, next) => {
		console.log(`req.session.passport.user: ${JSON.stringify(req.session.passport)}`);

	    if (req.isAuthenticated()) return next();
	    res.redirect('users/login')
	}
}

module.exports = router;