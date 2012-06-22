var net = require('net'),
	players = [],
	amZug = null,
	history = [],
	field = require('./spielfeld.js'),
	rl = require('readline').createInterface(process.stdin, process.stdout),
	allowNewPlayers = true;

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
players.push(host);

function sendeZug(zugdata, sender) {
	// sende an alle spieler
	for(var i in players) {
		if(players[i] && players[i] != sender) {
			players[i].write(JSON.stringify({
				a:'zug',
				content :zugdata
			}));
		}
	}
}

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
	process.stdout.write(field.getField());
}

function sendField() {
	players[i].write(JSON.stringify({name:'field',content:field.getField()}));
}

var server = net.createServer(function(socket){

	if(allowNewPlayers == false) {
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

	// zug
	socket.on('data', function(msg){
		// prüfe ob der spieler am zug ist
		if(socket != amZug) {
			console.log('Unvalid message');
			socket.write(JSON.stringify({err:1,msg:'Du bist nicht drann.'}));
			return;
		}
		// prüfe ob die nachricht valide ist
		try {
			data = JSON.parse(msg.toString());
		} catch (e) {
			socket.write(JSON.stringify({err:1,msg:'Invalide Nachricht'}));
			return;
		}

		// setze im feld
		field.set();
		
		// send
		sendeZug(data);
	});

	// dissconnect
	socket.on('disconnect', function(){
		for(var i in players){if(players[i] == socket) delete players[i]}
	});
});

/* START THE GAAAAAAAAMMMMMEEEEEEE */

function waitForStart() {
	allowNewPlayers = true;
	rl.question('Warte auf Mitspieler. Schreibe START um zu starten.', function(resp){
		if(resp == 'START') {
			allowNewPlayers = false;
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
	rl.question('Was für einen Zug möchtest du machen ? Format muss `X` sein. ( Oder ENDE um das Spiel zu beeenden. )', function(resp){
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
				console.log(field.getField());

				// check if host has won the game
				if(field.isFinished(r,c,'H')) {
					var winner = field.getWinner();
					console.log('Du hast gewonnen :)');
					sendMsg('win', 'Der Host hat gewonnen.');
					field.reset();
					waitForStart();
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
			players[i].write(JSON.stringify({a:'yourturn'}));
		}
		if(players[i] == lastPlayer) {
			next = true;
			if(i == (players.length - 1)) {
				players[0].write(JSON.stringify({a:'yourturn'}));
			}
		}
	}		
}

waitForStart();