'use strict';

const VERBOSE = process.argv[2];
//const VERBOSE = 'NO';
const DEBUG = "YES";
const HOME = process.env.HOME;
const DEFAULT_SUITE_NAME = process.env.HOSTNAME; ;
const DEFAULT_EMSSL_PORT = '4000';

let SUITE_NAME = process.env.SUITE_NAME || DEFAULT_SUITE_NAME;
let EMSSL_PORT = process.env.EMSSL_PORT || DEFAULT_EMSSL_PORT;
let SUITE_AUTHOR = 'LinhoSan';
let SUITE_AUTHOR_URL = 'https://bitbucket.org/LinhoSan/cm_underscore/';

const os = require("os");
const express = require ('express');
const multer = require('multer');
const app = express();
const favicon = require('serve-favicon');
const server = require('http').createServer(app);
const io = require('socket.io').listen(server);
const fs = require('fs');
const child_process = require('child_process');
const path = require('path');
const regExpReplace = require('replace-in-file');

let connections = [];

server.listen(EMSSL_PORT);

_log("- " + SUITE_NAME);
_log("  Running on port " + EMSSL_PORT + "\n");

app.use(favicon(path.join(__dirname, 'img', 'favicon.ico')))
app.use("/css",  express.static(__dirname + '/css'));
app.use("/img",  express.static(__dirname + '/img'));
app.use("/js",  express.static(__dirname + '/js'));
app.use("/views",  express.static(__dirname + '/views'));

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});



















function getGlobal(socket) {
	// Esempio: { EMSSL_PORT: '4003', SUITE_NAME: 'EM_SSL_Decoder', SUITE_AUTHOR: 'LinhoSan', SUITE_AUTHOR_URL: 'https://bitbucket.org/LinhoSan/' };
	
	let g = { EMSSL_PORT: EMSSL_PORT, SUITE_NAME: SUITE_NAME, SUITE_AUTHOR: SUITE_AUTHOR, SUITE_AUTHOR_URL: SUITE_AUTHOR_URL };
	_log('- socket.emit() getGlobal_Return');
	_log(g);
	socket.emit('getGlobal_Return', g);
}








function crt_Decode(socket, data) {	
	// Esempio: {  "CN": "DigiCert Global Root CA",  "Issuer": "DigiCert Global Root CA",  "NotBefore": "10 Nov 2006",  "NotAfter": "10 Nov 2031",  "Is_CA": "TRUE"};

	fs.writeFileSync('/tmp/dummy.crt', data, { mode: 0o755 });	
	_log('crt_Decode => writeFileSync: OK');
		
	const child = child_process.spawnSync(HOME + '/bin/getInfo', [ '/tmp/dummy.crt' ]);
	
	let cRet = child.stdout.toString().trim() ;
	let cStatus  = cRet.substr( 0, cRet.indexOf(':') ).trim();
	let cMessage = cRet.substr( cRet.indexOf(':') + 2 ).trim();
	_log('crt_Decode => getInfo => cRet => ' + cRet);
	_log('crt_Decode => getInfo => cStatus => ' + cStatus);
	_log('crt_Decode => getInfo => cMessage => ' + cMessage);
	
	if (cStatus == 'Fail')
	{
		cm_Avvisi('crt_Decode => getInfo', cStatus, cMessage, socket);
	}
	else if (cStatus == 'OK')
	{
		try {
			let ret = JSON.parse( cMessage );
			_log('crt_Decode => JSON.parse: ');
			_log(ret);
			
			socket.emit('crt_Decode_Return', ret);
			_log('- socket.emit() crt_Decode_Return');
			
		} catch (err) {
			cm_Exception('crt_Decode', err, socket);
		}
	}	
}














io.sockets.on('connection', function (socket) {
	connections.push(socket);
	_log(`- io.sockets.on() connection: ${connections.length} sockets connected; ID: ${socket.id}`);

	socket.on('disconnect', function (data){
		connections.splice(connections.indexOf(socket), 1);
		_log(`- socket.on() disconnect() ${connections.length} sockets connected; ID: ${socket.id}`);
	});
	
	
	
	
	socket.on('getGlobal', function (data) {
		_log('- socket.on() getGlobal');
		getGlobal(socket)
	});
	socket.on('crt_Decode', function (data) {
		_log('- socket.on() crt_Decode');
		_log(data);
		crt_Decode(socket, data)
	});
	
});








function isEmpty(value) {
	return typeof value == 'string' && !value.trim() || typeof value == 'undefined' || value === null;
}
function _log(messaggio) {
	if (VERBOSE == '-v')
		console.log(messaggio);
}
function _debug(messaggio) {
	if (DEBUG == 'YES')
		process.stdout.write("[DEBUG] ");
		console.log(messaggio);
}
function cm_Exception(func, err, socket) {
	
	let ret = [];
	ret = {	FUNCTION: func || '' ,
			 MESSAGE: err.message || '',
		 	   STACK: err.stack || '',
		 	    CODE: err.code || '',
		 	   ERRNO: err.errno || '',
		 	    PATH: err.path || ''
		 	    };
	
	socket.emit('cm_Exception', ret);
	console.log(`- socket.emit() cm_Exception: FUNCTION: (${ret.FUNCTION})`);
	console.log(`                               MESSAGE: (${ret.MESSAGE})`);
	console.log(`                                 STACK: (${ret.STACK})`);
	console.log(`                                  CODE: (${ret.CODE})`);
	console.log(`                                 ERRNO: (${ret.ERRNO})`);
	console.log(`                                  PATH: (${ret.PATH})`);
}
function cm_Error(func, err, socket) {
	
	let ret = [];
	ret = {	FUNCTION: func || '' ,
			 MESSAGE: err.message || '',
		 	    CODE: err.code || '',
		 	   ERRNO: err.errno || '',
		 	    PATH: err.path || ''
		 	    };
	
	socket.emit('cm_Error', ret);
	console.log(`- socket.emit() cm_Error: FUNCTION: (${ret.FUNCTION})`);
	console.log(`                           MESSAGE: (${ret.MESSAGE})`);
	console.log(`                              CODE: (${ret.CODE})`);
	console.log(`                             ERRNO: (${ret.ERRNO})`);
	console.log(`                              PATH: (${ret.PATH})`);
}
function cm_Avvisi(func, status, message, socket) {
	
	let ret = [];
	ret = {	FUNCTION: func || '' ,
			  STATUS: status || '' ,
			 MESSAGE: message || ''
		 	    };
	
	socket.emit('cm_Avvisi', ret);
	console.log(`- socket.emit() cm_Avvisi: FUNCTION: (${ret.FUNCTION})`);
	console.log(`                             STATUS: (${ret.STATUS})`);
	console.log(`                            MESSAGE: (${ret.MESSAGE})`);
}