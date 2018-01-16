var express = require('express');
var router = express.Router();
var passport = require('passport');

var roomList = [];
var roomno = 1;
var cards = createRandomCards();
username = null;
playersJoined = 0;

/* GET profile page. */
router.get('/', function(req, res) {	
	if (req.isAuthenticated() == true){
		username = req.user.username;
		res.render('game', { title: 'Match!', username: req.user.username, test_username: 'test username' });
	} else {		
		res.redirect('../');
	}   
});

function watchGame(io,socket) {		
    	socket.on('endGame', function(data) {
    		io.to(data.room).emit('showResults',{
    			username: data.username,
    			turnsTaken: data.turnsTaken
    		}); 
		});
}

function createGame(io, socket)	{
	var yourTurn = true;
	if (io.nsps['/'].adapter.rooms["room-"+roomno]){
		length = io.nsps['/'].adapter.rooms["room-"+roomno].length;
	} else {
		length = 0;
	}

	if(playersJoined > 1) {
		cards = createRandomCards();
		roomno++;
		playersJoined=0;
	} else if(playersJoined == 1 && length == 1)  {
		yourTurn= false;
	} else if(playersJoined == 1 && length == 0)  {
		cards = createRandomCards();
		roomno++;
		playersJoined=0;
	}
	playersJoined++;
	

	var roomName = "room-"+roomno;
	socket.join(roomName);
	roomList[socket.id] = roomName;

	//Send this event to everyone in the room.
	console.log('game.js: ' + username);
	io.to(roomName).emit('gameCreate', {
		room : roomName,
		cards: cards,
		turn: yourTurn,
		username: username
	});

	console.log("You are in room no. " + roomno);

	socket.on('message', function(data) {  
			message = data.username + ': ' + data.message;      
        	io.to(data.room).emit('message',{
        		message: message
        	});
    });
}

function joinGame(io,socket) {		
		socket.on('join', function(data) {  
			var message = data.username + ' joined room';      
        	io.to(data.room).emit('message',{
        		message: message
        	});
        	message = 'Game started.';
        	if(data.start == true){
        		io.to(data.room).emit('message',{
        			message: message
        		});
        		io.to(data.room).emit('takeTurn',{});
        	}
    	});
    	socket.on('endTurn', function(data) {
			io.to(data.room).emit('switchTurn',{});
			io.to(data.room).emit('takeTurn',{});
		});
}

// Taken from stackoverflow to shuffle cards
// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffle(array) {
  var currentIndex = array.length, temporaryValue, randomIndex;

  // While there remain elements to shuffle...
  while (0 !== currentIndex) {

    // Pick a remaining element...
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    // And swap it with the current element.
    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function createRandomCards()	{
	var randomCards = [];
	for(var i = 0; i < 8; i++)	{
		var randomNumber = Math.floor(Math.random() * 50);
		while(randomCards.indexOf(randomNumber) !== -1)	{
			randomNumber = Math.floor(Math.random() * 50);
		}
		randomCards.push(randomNumber);
		randomCards.push(randomNumber);
	}
	randomCards = shuffle(randomCards);
	return randomCards;
}

module.exports = function(io)	{

	io.on('connection', function(socket){		
		createGame(io, socket);
		joinGame(io, socket);	
		watchGame(io, socket);	
	});

	return router;
}