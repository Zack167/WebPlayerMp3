/* Questo è il codice principale del server, si occupa di instradare le richieste che vengono inoltrate dal client
	 in base al loro indirizzo verso dei moduli specifici, ciascuno dedicato ad un certo ambito di lavoro */

/* Innanzitutto richiedo le dipendenze che ho scaricato e che sono registrate nel file package.json */
var express = require('express');
var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var path = require('path');
var mysql = require('mysql');

/* per inizializzare il server */
var app = express();

/* Questi sono i moduli che si occupano di rispondere alle richieste specifiche del client */
var access = require('./access');
var search = require('./search');
var friend = require('./friend');
var song = require('./song');
var verify = require('./verify');
var playlist = require('./playlist');

/* Questi ultimi due si occupano delle richieste di file interni alle carte client e songs,
	 necessari affinché il client possa accedere ai file css, js e alle canzoni */
var client = path.join('client');
var songs = path.join('songs');

app.use(bodyParser.json());
app.use(cookieParser());

/* Con questa porzione di codice recupero tutte le richieste degli utenti, in questo modo
	 per ogni azione compiuta li segnalo come online e aggiorno la loro ultima azione svolta */
app.use('/', function(req, res, next) {
	if(req.cookies.email) {
		access.setUserOnline(req.cookies.email);
		access.refreshLastAction(req.cookies.email);
	}
	next();
});

/* In questo modo le varie richieste verranno inoltrate ai moduli corrispondenti */
app.use('/access', access);
app.use('/search', search);
app.use('/friend', friend);
app.use('/verify', verify);
app.use('/song', song);
app.use('/playlist', playlist);
// Questi servono affinché le pagine possano richiedere altre risorse quali file .css, .js, immagini, audio
app.use(express.static(client));
app.use('/songs', express.static(songs));

// se la richiesta non è stata raccolta dai precedenti moduli, allora mando index.html
app.use('/', function(req, res) {
  res.sendFile(path.resolve(path.join(client, 'index.html')));
});

/* Questo è il metodo che viene richiamato dal file index.js nella cartella www, necessario
	 per avviare il server e mettersi in ascolto sulla porta 3000 */
module.exports.startServer = function () {
	app.listen(3000, function () {
		console.log('WebPlayerMp3 listening on port 3000!');
	})
}