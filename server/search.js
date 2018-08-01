var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var path = require('path');

var client = path.join('client');

var con = mysql.createConnection({
  host: "localhost",
  user: "gruppo11_admin",
  password: "vagrant"
});

con.query('USE gruppo11', function (err) {
	if (err) throw err;
});

/* Questo file permette di eseguire la ricerca generica di playlist, brani e altri utenti
	 che trovano una corrispondenza in una parola chiave inserita dall'utente */

/* Questa porzione di codice richiede al database tutte e sole le playlist che sono pubbliche
	 o che appartengono all'utente e che hanno il titolo corrispondente con la parola chiave
	 passata dall'utennte  */
router.post('/playlist', function (req, res) {
	var keyword = req.body.keyword;
	var actualUser = req.cookies.email;
	// seleziono soltanto le playlist pubbliche o che appartengono all'utente
	con.query('SELECT p.id_playlist AS id, p.title AS title ' +
						'FROM playlist AS p LEFT OUTER JOIN user_has_playlist AS up ON ( p.id_playlist=up.playlist_id_playlist ) ' +
						'LEFT OUTER JOIN user AS u ON (u.email=up.user_email) ' +
						'WHERE p.title="' + keyword + '" AND ( p.isPublic="true" OR (u.email="' + actualUser +
						'" AND u.email=up.user_email AND p.id_playlist=up.playlist_id_playlist AND p.isPublic="false"))', function (err, result) {
		if(err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		if (result !== null && result.length > 0) {
			res.statusCode = 200;
			var array = [];
			for(var i = 0; i < result.length; i++) {
				array.push({"id": result[i].id, "title": result[i].title});
			}
			res.json(array);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({message: 'Nessuna playlist corrispondente'});
			return res.end();
		}
	})
});

/* Questa porzione di codice richiede al database le informazioni principali di una canzone
	 il cui titolo o il cui autore corrisponde alla parola chiave passata nel corpo della richiesta,
	 affinché l'utente possa visualizzarne titolo ed autore, e possa mandarle in esecuzione
	 sfruttando l'id di ciascuna canzone */
router.post('/song', function (req, res) {
	var keyword = req.body.keyword;
	con.query('SELECT id_song, title, author FROM song ' +
						'WHERE title="' + keyword + '" OR author="' + keyword + '";', function(err, result) {
		if(err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		if (result !== null && result.length > 0) {
			res.statusCode = 200;
			var array = [];
			for (var i = 0; i < result.length; i++) {
				array.push({"id": result[i].id_song, "title": result[i].title, "author": result[i].author});
			}
			res.json(array);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({message: 'Nessun brano corrispondente'});
			return res.end();
		}
	})
});

/* Con questa porzione di codice richiedo al server la lista di utenti il cui nome o il cui
	 cognome corrisponde alla parola chiave inserita dall'utente che ha eseguito la ricerca generica,
	 ma non permetto all'utente che ha effettuato la richiesta di trovare sé stesso */
router.post('/user', function(req, res) {
	var keyword = req.body.keyword;
	var actualUser = req.cookies.email;
	con.query('SELECT first_name, last_name, email ' +
						'FROM user WHERE (first_name="' + keyword + '" OR last_name="' + keyword +
						'") AND email!="' + actualUser +'"', function(err, result) {
		if(err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		if (result !== null && result.length > 0) {
			res.statusCode = 200;
			var array = [];
			for (var i = 0; i < result.length; i++) {
				array.push({"email": result[i].email, "name": result[i].first_name, "surname": result[i].last_name});
			}
			res.json(array);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({message: 'Nessun utente corrispondente'});
			return res.end();
		}
	})
});

module.exports = router;