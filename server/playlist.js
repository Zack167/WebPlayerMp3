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

/* Per creare una nuova playlist il client ha bisogno innanzitutto di sapere qual è il valore
	 massimo di id della playlist, in questo modo potrà utilizzarlo per salvare la sua playlist */
router.post('/maxid', function (req, res) {
	con.query('SELECT id_playlist AS id FROM playlist', function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		// sono sicuro che c'è almeno un risultato dato che ci sono le playlist pubbliche
		var max = 0;
		for (var i = 0; i < result.length; i++) {
			max = parseInt(result[i].id) > max ? parseInt(result[i].id) : max;
		}
		res.json({id: max});
		return res.end();
	});
});

/* Per l'operazione di creazione di una playlist */

router.post('/new', function (req, res) {
	var email = req.cookies.email;
	var idPlaylist = parseInt(req.body.id);
	var title = req.body.title;
	var idSongs = req.body.idSongs;
	console.log(req.body);
	// prima di tutto inserisco nella tabella playlist la nuova playlist
	con.query('INSERT INTO playlist (id_playlist, title, isPublic) VALUES (' + idPlaylist + ', "' + title + '", "false")', function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		} else {
			console.log("qui ci arriva");
			// se il primo inserimento va bene, cerco di inserire nella tabella playlist_has_song tutte le canzoni selezionate
			for (var i = 0; i < idSongs.length; i++) {
				con.query('INSERT INTO playlist_has_song (playlist_id_playlist, song_id_song) VALUES ' +
									'(' + idPlaylist + ', ' + parseInt(idSongs[i]) + ') ', function (err1, result1) {
					if (err1) {
						// se qualcosa va male cancello tutto il lavoro fatto finora
						con.query('DELETE FROM playlist_has_song WHERE playlist_id_playlist=' + idPLaylist + ';', function (err2, result2) {
							if (err2) throw err2;
							con.query('DELETE FROM playlist WHERE id_playlist=' + idPLaylist + ';' , function (err3) {
								if (err3) throw err3;
								// devo sempre avvisare l'utente degli errori
								res.json({error: "Errore nella connnessione con il database"});
								return res.end();
							});
							res.json({error: "Errore nella connnessione con il database"});
							return res.end();
						});
					}
				});
			}
			// A questo punto posso inserire la playlist come playlist personale dell'utente che l'ha creata
			con.query('INSERT INTO user_has_playlist (user_email, playlist_id_playlist) VALUES ' +
								'( "' + email + '", ' + idPlaylist +')', function (err4, result4) {
				if (err4) {
					// Ancora una volta se si presentano errori devo cancellare il lavoro svolto prima
					con.query('DELETE FROM playlist_has_song WHERE playlist_id_playlist=' + idPLaylist + ';', function (err5, result5) {
						if (err5) throw err5;
						con.query('DELETE FROM playlist WHERE id_playlist=' + idPLaylist + ';' , function (err6) {
							if(err6) throw err6;
							// devo sempre avvisare l'utente degli errori
							res.json({error: "Errore nella connnessione con il database"});
							return res.end();
						});
						res.json({error: "Errore nella connnessione con il database"});
						return res.end();
					});
					res.json({error: "Errore nella connnessione con il database"});
					return res.end();
				}
			});
			res.json({message: "Playlist salvata correttamente"});
			return res.end();
		}
	});
});

/* Affinché l'utente possa vedere una playlist e le canzoni contenute al suo interno */

router.post('/show', function (req, res) {
	var id = req.body.id;
	/* Vengono richiesti il titolo della playlist e le informazioni sulle canzoni che essa contiene 
		 nonché il valore isPublic, utilizzato per fare in modo che il client non possa cancellare le
		 playlist di default del sistema, ma solo quelle personali, inoltre sono sicuro che otterrà
		 solo una delle sue playlist in quanto l'ID ottenuto deriva dalla fase di ricerca, che restituisce
		 all'utente solo playlist pubbliche o personali */
	con.query('SELECT p.title AS playlist_title, p.isPublic AS public, s.title AS song_title, s.author AS author, s.id_song AS id ' +
						'FROM playlist AS p, song AS s, playlist_has_song AS ps ' +
						'WHERE p.id_playlist=ps.playlist_id_playlist AND s.id_song=ps.song_id_song ' +
						'AND p.id_playlist=' + id, function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		} else {
			var songs = [];
			for (var i = 0; i < result.length; i++) {
				songs.push({song_title: result[i].song_title, author: result[i].author, song_id: result[i].id});
			}
			console.log(songs);
			res.json({title: result[0].playlist_title, public: result[0].public, songs: songs});
			return res.end();
		}
	});
});

/* Serve per fare in modo che l'utente possa cancellare una delle sue playlist,
	 non può cancellare una playlist di default per i motivi descritti alla riga 100
	 di questo file */

router.post('/delete', function (req, res) {
	console.log(req.body.id);
	var idPlaylist = parseInt(req.body.id);
	console.log(idPlaylist);
	con.query('DELETE FROM playlist_has_song WHERE playlist_id_playlist=' + idPlaylist + ';', function (err, result) {
		if(err) {
			res.json({error: "error"});
			return res.end();
		}
		con.query('DELETE FROM user_has_playlist WHERE playlist_id_playlist=' + idPlaylist + ';', function (err2, result2) {
			if(err) {
				res.json({error: "error"});
				return res.end();
			}
			con.query('DELETE FROM playlist WHERE id_playlist=' + idPlaylist + ';', function (err3, result3) {
				if (err) {
					res.json({error: "error"});
					return res.end();
				}
				res.statusCode = 200;
				res.json({message: "deleted"});
				res.end();
			})
		});
	});
});

module.exports = router;