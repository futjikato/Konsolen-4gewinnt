var net = require('net'),
	players = [],
	amZug = null,
	history = [],
	field = require('./spielfeld.js'),
	rl = require('readline').createInterface(process.stdin, process.stdout),
	allowNewPlayers = true,
	red = '\u001b[31m',
	blue = '\u001b[34m',
	yellow = '\u001b[33m',
	cReset = '\u001b[0m';

// DUMMY object
function Host() {
	this.write = function(str){
		var data = JSON.parse(str);
		if(data.a == 'yourturn') {
			askForZug();
			return;
		}
	}
}
var host = new Host();
players.push(host)

var api = {
	move: function(data, socket) {
		// check if turn was valid on the battlefield
		if(field.set(data.c, data.id) < 0) {
			console.log('Invalid turn. Check if the column is free.');
			socket.write(JSON.stringify({err:1,msg:'Invalid turn. Check if the column is free.'}));
			return;
		}

		sendMsg('field', {field:field.getField()});
		console.log(field.getField());
		
		// check if player has won the game
		if(field.isFinished()) {
			var winner = field.getWinner();
			console.log('Player ' + winner + ' has won !');
			field.reset();
			waitForStart();
			sendMsg('winner', {winner:winner});
			return;
		}
		
		nextTurn(amZug);
	}
};

function sendMsg(type, msg) {
	// sende an alle spieler
	for(var i in players) {
		if(players[i]) {
			players[i].write(JSON.stringify({
				a : type,
				content : msg
			}));
		}
	}
}

function printField() {
	console.log('\u001b[2J');
	process.stdout.write(field.getField());
}

function sendField() {
	players[i].write(JSON.stringify({name:'field',content:field.getField()}));
}

var server = net.createServer(function(socket){

	if(allowNewPlayers == false) {
        console.log('Player access denied');
		socket.destroy();
		return;
	}

	// füge spieler hinzu
	players.push(socket);

	var pid = players.length;
	socket.write(JSON.stringify({
		a:'welcome',
		content:{
			id : pid,
			msg : "Hallo Spieler `" + pid + "`"
		}
	}));

	console.log('New Player with id `' + pid + '` has joined.');

	// zug
	socket.on('data', function(msg){
		// prüfe ob die nachricht valide ist
		try {
			data = JSON.parse(msg.toString());
		} catch (e) {
			console.log('Invalid message recieved.');
			socket.write(JSON.stringify({err:1,msg:'Invalide Nachricht'}));
			return;
		}
		
		if(data.a == 'move') {
			// prüfe ob der spieler am zug ist
			if(socket != amZug) {
				console.log('Unvalid message');
				socket.write(JSON.stringify({err:1,msg:'Du bist nicht drann.'}));
				return;
			}
		}
		
		if(typeof api[data.a] == 'function') {
			api[data.a](data.content, socket);
		} else {
			console.log('Invalid api call recieved.');
			socket.write(JSON.stringify({err:1,msg:'Invalide api call'}));
		}
	});

	// dissconnect
	socket.on('disconnect', function(){
		for(var i in players){if(players[i] == socket) delete players[i]}
	});
});
server.listen(1389, function(){
    waitForStart();
});

/* START THE GAAAAAAAAMMMMMEEEEEEE */

function waitForStart() {
	allowNewPlayers = true;
	rl.question("Warte auf Mitspieler. Schreibe " + blue + "START" + cReset + " um zu starten.\n", function(resp){
		if(resp == 'START') {
			allowNewPlayers = false;
			
			// notice all palyers about game start
			sendMsg('start', {});
			// send all players empty field
			sendMsg('field', {field:field.getField()});
			
			amZug = 'host'; // host macht ersten zug
			console.log(field.getField());
			askForZug();
		} else if(resp == 'END') {
			console.log('Danke, dass du 4gewinnt auf der Konsole gespielt hast.');
			process.exit(0);
		} else {
			console.log('Wa ?');
			waitForStart();
		}
	});
}

function askForZug() {
	rl.question('Gib die Nummer der Spalte an in welche du nun einen Block legen möchtest. ( Oder ' + blue +'ENDE' + cReset + ' um das Spiel zu beeenden. )', function(resp){
		if(resp == 'ENDE') {
			console.log('Danke, dass du 4gewinnt auf der Konsole gespielt hast.');
			for(var i in players) {
				players[i].write(JSON.stringify({
					a:'bye',
					content:'Host hat das Spiel beendet.'
				}));
			}
			process.exit(0);
		}
		var res = resp.replace("\n", "").match(/^([1-7]{1})$/);
		if(res) {
			var c = parseInt(res[1]) - 1;
			if(field.isValid(c)) {
				console.log('OK.');
				var r = field.set(c, 'H');
				printField();

				sendMsg('field', {field:field.getField()});

				// check if host has won the game
				if(field.isFinished()) {
					var winner = field.getWinner();
					console.log('Du hast gewonnen :)');
					field.reset();
					waitForStart();
					sendMsg('winner', {winner:winner});
					return;
				}

				// next turn
				nextTurn(host);
			} else {
				console.log('Invalider Zug. Du musst ein Feld angeben, das über einen bestehenden Feld, oder am Boden ist.');
				askForZug();
			}
		} else {
			console.log('Invalider Zug.');
			askForZug();
		}
	});
}

function nextTurn(lastPlayer) {
	var next = false;
	for(var i in players) {

		if(next) {
			amZug = players[i];
			players[i].write(JSON.stringify({a:'yourturn', content:{field:field.getField()}}));
			break;
		}

		// singleplayer game with just one host
		if(players[i] == lastPlayer) {
			next = true;
			if(i == (players.length - 1)) {
				amZug = players[0];
				players[0].write(JSON.stringify({a:'yourturn', content:{field:field.getField()}}));
			}
		}
	}		
}