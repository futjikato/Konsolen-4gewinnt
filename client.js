var net = require('net'),
	socket = null,
	playid = null,
	rl = require('readline').createInterface(process.stdin, process.stdout);

/* Action helper ( if another layer of persitens is needed :) */
function ActionHandler() {

	var api = {
		welcome : function(data) {
			playid = data.id;
			console.log(data.msg);
		},
		yourturn : function(data, cb) {
			askForTurn(cb);
		},
		field : function(data) {
			console.log('New field.');
			console.log(data.field);
		},
		winner : function(dtaa) {
			console.log(data.winner + "has won the game !");
		}
	}

	this.process = function(req, cb) {

		// handle errors from server
		if(req.err) {
			console.log(req.msg);
			return;
		}

		// check if action exists
		if(!api[req.a]) {
			cb('Action not found');
			return;
		}

		// get response
		api[req.a](req.content, cb);
	}
}
var handler = new ActionHandler();

function connect(ip, port) {
	try {
        console.log('Try to conect to ' + ip + ':' + port);
		socket = net.connect(port, ip, function(){
			console.log('Connected to host ! Wating for further infos from host.');
		});

		socket.on('data', function(buffer){
			var data = JSON.parse(buffer.toString());
			handler.process(data, function(resp){
				// if response is an object send it as response
				if(typeof resp == 'object') {
					socket.write(JSON.stringify(resp));
				}
			});
		});

		socket.on('error', function(err){
			console.log("ERROR => " + err.toString());
		});
	} catch(e) {
		console.log('No connection to host.');
		askForConnection();
	} 
}

function askForConnection() {
	rl.question('Enter IP of the host :', function(ip){
		rl.question('Enter port of the host ( Default is 1389 ) :', function(port){
			if(!ip) ip = '127.0.0.1';
			if(!port) port = 1389;
			connect(ip, port);
		});
	});
}

function askForTurn(cb) {
	rl.question('Enter the position where you want to drop the next item.', function(c){
		c = parseInt(c);
		if(isNaN(c)) {
			console.log('Invalid input');
			askForTurn();
			return;
		}
		cb({
			c : c,
			id : playid
		});
	});
}

askForConnection();