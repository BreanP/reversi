var static = require('node-static');

var http = require('http');

var port = process.env.PORT;
var directory = __dirname + '/public';

if(typeof port == 'undefined' || !port) {
	directory = './public';
	port = 8080;
}

var file = new static.Server(directory);

var app = http.createServer(
	function(request,response) {
		request.addListener('end',
			function() {
				file.serve(request,response);
			}
		).resume();
	}
).listen(port);

console.log('The server is running');

/* Set up the web socket server */
var io = require('socket.io').listen(app);

io.sockets.on('connection', function (socket) {
	function log() {
		var array = ['*** Server Log Message: '];
		for(var i = 0; i < arguments.length; i++){
			array.push(arguments[i]);
			console.log(arguments[i]);
		}
		socket.emit('log',array);
		socket.broadcast.emit('log',array);
	}
	log('A web site connected to the server');

	socket.on('disconnect',function(socket) {
		log('A web site disconnected from the server');
	});


	socket.on('join_room',function(socket) {
		log('server received a command','join_room',payload);
		if(('undefined' === typeof payload) || !payload){
			var error_message = 'join_room had no payload, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
																						result: 'fail',
																						message: error_message
																				});
			return;
		}

		var room = payload.room;
		if(('undefined' === typeof room) || !room){
			var error_message = 'join_room didn\'t specify a room, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
																						result: 'fail',
																						message: error_message
																				});
			return;
		}

		var username = payload.username;
		if(('undefined' === typeof username) || !username){
			var error_message = 'join_room didn\'t specify a username, command aborted';
			log(error_message);
			socket.emit('join_room_response', {
																						result: 'fail',
																						message: error_message
																				});
			return;
		}

		socket.join(room);

		var roomObject = io.sockets.adapter.rooms[room];
		if(('undefined' === typeof roomObject) || !roomObject){
			var error_message = 'join_room couldn\'t create a room (internal error), command aborted';

			log(error_message);
			socket.emit('join_room_response', {
																						result: 'fail',
																						message: error_message
																				});
			return;
		}
		var numClients = roomObject.length;
		var success_data = {
														result: 'success',
														room: room,
														username: username,
														membership: (numClients + 1);
												};
		io.sockets.in(room).emit('join_room_response',success_data);
		log('Room '+room+' was joined by '+username);
	});
});
