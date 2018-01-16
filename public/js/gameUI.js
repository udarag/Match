var socket = io.connect();
var cardsChosen = [];
var successfulCardMatches = [];

window.onload = function()  {
    cards = document.getElementsByClassName("card-contents");

    document.getElementById("messageButton").addEventListener("click", function()   {
        var input = document.getElementById("messageInput").value;
        if(input.length == 0 )  return;
        socket.emit('message', {
            room: currentGame.room,
            message: input,
            username: username
        })  
    });

    myFunction = function() {
        var index = this.getAttribute("data-value");
        if(cardsChosen.indexOf(index) !== -1)   {
            console.log(index + " already in list");
        }
        else if(currentGame.revealedCards == 1) {
            console.log("Pused next card");
            cards[index].innerHTML = currentGame.cards[index];
            cards[index].style.backgroundColor = 'white';
            cardsChosen.push(index);
            console.log("2 cards in array");
            checkCards();
            cardsChosen = [];
            currentGame.revealedCards = 0;
            hideCards();
        }
        else    {
            console.log("Paused next card");
            cardsChosen.push(index);
            currentGame.revealedCards++;
            cards[index].innerHTML = currentGame.cards[index];
            cards[index].style.backgroundColor = 'white';
        }
    };
    for (var i = 0; i < cards.length; i++) {
        cards[i].addEventListener('click', myFunction, false);
    }
}

socket.on('connect', function() {
  console.log('Client connected');
});

socket.on('disconnect', function() {
  console.log('Client connected');
});

socket.on('message', function(data) {
	var messageBox = document.getElementById("messagesBox");
	var message = document.createElement("li");
	message.appendChild(document.createTextNode(data.message));
	messageBox.appendChild(message);
	$('.list-group').scrollTop($('.list-group')[0].scrollHeight);
});



socket.on('gameCreate', function(data) {
	socket.removeAllListeners("gameCreate");
	currentGame = new Game(data);
	joinStatus(currentGame.turn);	
	handleTurn(socket);
	results(socket);	
});

var results = function(socket) {
	socket.on('showResults', function(data){
		var gameContainer = document.getElementById("game-container");
		var statusContainer = document.getElementById("status-container");
		var resultsContainer = document.getElementById("results-container");
		var resultsWinner = document.getElementById("results-winner");
		var resultsScore = document.getElementById("results-score");
		while(gameContainer.hasChildNodes()){
		 	gameContainer.removeChild(gameContainer.lastChild);
		}
		while(statusContainer.hasChildNodes())	{
		 	statusContainer.removeChild(statusContainer.lastChild);
		}
		resultsWinner.innerHTML = data.username + " Wins!";
		resultsScore.innerHTML = data.turnsTaken + " Turns";
		resultsContainer.style.display = "block";
	})
}

var handleTurn = function(socket) {
	socket.on('takeTurn', function(data) {
		if(currentGame.turn == true){
			currentGame.turnsTaken++;
            for (var i = 0; i < cards.length; i++) {
                var index = cards[i].getAttribute("data-value");
                if(successfulCardMatches.indexOf(index) === -1) {
                    cards[i].addEventListener('click', myFunction, false);   
                }
            }
			gameStatus.innerHTML = "Your turn!";
			
		} else {
            for (var i = 0; i < cards.length; i++) {
                cards[i].removeEventListener('click', myFunction, false);
            }
			gameStatus.innerHTML = "Wait for your turn...";
		}
	});

	socket.on('switchTurn', function(data) {
		if(currentGame.turn == true){
			currentGame.turn = false;
		} else {
			currentGame.turn = true;
		}
	})
}

var joinStatus = function(turn_status){
	gameStatus = document.getElementById("status");
    for (var i = 0; i < cards.length; i++) {
        cards[i].removeEventListener('click', myFunction, false);
    }
	//event listeners destory
	if(currentGame.turn == true){
		gameStatus.innerHTML = "Wait for player to join...";
		start = false;	
	} else {
		gameStatus.innerHTML = "Wait for your turn...";	
		start = true;
	}
	socket.emit('join', {
		room: currentGame.room,
		username: currentGame.username,
		start: start
	})
}


var Game = function(socketData) {
    this.room = socketData.room;
    this.cards = socketData.cards;
    this.score = 0;
    this.turn = socketData.turn;
    this.username = socketData.username;
    this.revealedCards = 0;
    this.correctCards = 0;
    this.matches = 0;
    this.turnsTaken = 0;
}
var checkCards = function() {
    var classname = document.getElementsByClassName("card-contents");
    if(currentGame.cards[cardsChosen[0]] == currentGame.cards[cardsChosen[1]])  {
        successfulCardMatches.push(cardsChosen[0]);
        successfulCardMatches.push(cardsChosen[1]);
        classname[cardsChosen[0]].removeEventListener('click', myFunction, false);
        classname[cardsChosen[1]].removeEventListener('click', myFunction, false);              
        console.log("Cards match");
        currentGame.matches++;
        input = 'Made match ' + currentGame.matches + ' of 8'
        socket.emit('message', {
            room: currentGame.room,
            message: input,
            username: currentGame.username
        });
        if(currentGame.matches == 8){
        	socket.emit('endGame', {
        		turnsTaken: currentGame.turnsTaken,
        		username: currentGame.username,
        		room: currentGame.room
        	});
        }
    }
    socket.emit('endTurn', {room: currentGame.room});
}

function hideCards()  {
    setTimeout(function(){
        for(var i = 0; i < cards.length; i++)   {
            var index = cards[i].getAttribute("data-value");
            if(successfulCardMatches.indexOf(index) === -1) {
                cards[i].innerHTML = "M!";
                cards[i].style.backgroundColor = '#F9F9F9';
            }
        }
    }, 2000);  
}

