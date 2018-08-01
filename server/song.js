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

/* Questa porzione di codice serve affinché l'utente possa ottenere le informazioni su
	 presenti nel database, viene sfruttata solo nel caso in cui l'utente cerchi di
	 creare una nuova playlist personale */

router.post('/all', function (req, res) {
	con.query('SELECT id_song, title, author FROM song ORDER BY title', function (err, result) {
		if (err) throw err;
		if (result !== null && result.length > 0) {
			var array = [];
			for (var i = 0; i < result.length; i++) {
				array.push({id: result[i].id_song, title: result[i].title, author: result[i].author});
			}
			res.json(array);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({message: "Nessuna canzone nel database"});
			return res.end();
		}
	});
});

/* Questa porzione di codice permette all'utente di recuperare le informazioni su una canzone*/

router.post('/one', function (req, res) {
	var id = parseInt(req.body.id);
	console.log(req.body.id);
	con.query('SELECT mp3_path, title, author FROM song WHERE id_song=' + id, function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		console.log(result);
		res.statusCode = 200;
		res.json({path: result[0].mp3_path, title: result[0].title, author: result[0].author});
		return res.end();
	});
});

/* Questa porzione di codice è molto importante, serve a fare in modo che venga aggiornata
	 l'ultima canzone in riproduzione di un utente, in maniera tale che gli utenti amici di
	 quest'ultimo possano visualizzare la sua canzone attualmente in ascolto */

router.post('/savecontext', function (req, res) {
	var email = req.cookies.email;
	var idSong = parseInt(req.body.idSong);
	var pausedTime = parseInt(req.body.pausedTime);
	con.query('SELECT title FROM song WHERE id_song=' + idSong, function (err, result) {
		if (err) throw err;
		con.query('UPDATE user SET song_id_song=' + idSong + ', pause_time_song=' + pausedTime +
							', reproductionSong="' + result[0].title + '" WHERE email="' + email + '";', function (err, result) {
			if (err) throw err;
			console.log("saved");
			res.json({ok: "saved"});
			return res.end();
		});
	});
});

/* Questa porzione serve a fare in modo che appena l'utente si ricollega da un nuovo
	 dispositivo oppure dopo un logout, possa riascoltare la canzone a parte dall'ultimo
	 punto registrato nel database, in questo modo potrà iniziare una canzone in un
	 dispositivo, metterla in pausa, eseguire il login su un altro dispositivo e mandarla
	 in esecuzione dal punto in cui l'aveva lasciata */
	 
router.post('/getcontext', function (req, res) {
	var email = req.cookies.email;
	con.query('SELECT u.song_id_song AS songId, u.pause_time_song AS pausedTime, s.title AS title, s.author AS author, s.mp3_path AS path ' +
						'FROM user AS u LEFT OUTER JOIN song AS s ON (u.song_id_song=s.id_song) ' +
						'WHERE u.email="' + email + '";', function (err, result) {
		if (err) throw err;
		if (result !== null && result.length>0) {
			if (result[0].songId !== null && result.length > 0) {
				res.statusCode = 200;
				res.json({idSong: result[0].songId, pausedTime: result[0].pausedTime, title: result[0].title, author: result[0].author, path: result[0].path});
				return res.end();
			} else {
				res.json({message: "no song"});
				return res.end();
			}
		} else {
			res.json({message: "no song"});
			return res.end();
		}
	})
});

module.exports = router;