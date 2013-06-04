var rows = 6,
	filledFields = [],
	fin = false,
	lastSet = [0,0],
	red = '\u001b[1;31m',
	blue = '\u001b[34m',
	yellow = '\u001b[33m',
	cReset = '\u001b[0m';

for(var i = 0; i < rows; i++) filledFields[i] = [];

function getDecoratorRow() {
	return "╠═╬═╬═╬═╬═╬═╬═╣\n";
}
function getDecoratorStartRow() {
	return " 1 2 3 4 5 6 7\n╔═╦═╦═╦═╦═╦═╦═╗\n";
}
function getDecoratorEndRow() {
	return "╚═╩═╩═╩═╩═╩═╩═╝\n";
}

module.exports.getField = function(){
	var output = "";
	// row
	output += getDecoratorStartRow();
	for(var r = 0 ; r <= 5 ; r++) {
		if(r > 0) {
			output += getDecoratorRow();
		}
		for(var c = 0 ; c <= 6 ; c++) {
			output += "║";
			if(filledFields[r] && filledFields[r][c]) {
				if(r == lastSet[0] && c == lastSet[1]) {
					output += red;
				}
				output += filledFields[r][c];
				if(r == lastSet[0] && c == lastSet[1]) {
					output += cReset;
				}
			} else {
				output += " ";
			}
		}
		output += "║\n";
	}
	output += getDecoratorEndRow();
	return output;
};

module.exports.isValid = function(c){
	return typeof filledFields[0][c] == 'undefined';
};

/**
 * Set a player id into battlefield
 * Returns -1 on error
 */
module.exports.set = function(c,PlayerId) {

	function checkWin(x, y) {
		var dirs = ['o','u','l','r','lu','ru','lo','ro'];
		for(var i in dirs) {
			if(checkDirWin(dirs[i], x, y, 0, PlayerId)) {
				return true;
			}
		}
		return false;
	}

	var row = rows - 1;

	for(var r = 0; r < rows; r++) {
		if(typeof filledFields[r][c] != 'undefined') {
			row = r - 1;
			break;
		}
	}

	if(row < 0) {
		return -1;
	}

	filledFields[row][c] = PlayerId;
	lastSet = [row, c];
	
	if(checkWin(row, c)) {
		fin = true;
		winner = PlayerId;
	}
	
	return row;
}

var winner = null;
function checkDirWin(dir, x, y, i, playerid) {
	if(typeof filledFields[x] == 'object' && filledFields[x][y] == playerid) {
		if(++i == 4) {
			return true;
		} else {
			switch(dir) {
				case 'o' : --x; break;
				case 'u' : ++x; break;
				case 'l' : --y; break;
				case 'r' : ++y; break;
				case 'lo' : --y; --x; break;
				case 'ro' : ++y; --x; break;
				case 'lu' : --y; ++x; break;
				case 'ru' : ++y; ++x; break;
				default : throw new Error('Invalid direction given : ' + dir);
			}
			return checkDirWin(dir, x, y, i, playerid);
		}
	}
	return false;
}

module.exports.isFinished = function() {
	return fin;
}
module.exports.getWinner = function() {
	return winner;
}

module.exports.reset = function() {
	fin = false;
	lastSet = [0,0],
	winner = null;
	filledFields = [];
	for(var i = 0; i < rows; i++) filledFields[i] = [];
}