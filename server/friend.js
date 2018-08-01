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

/* Con questa porzione di codice vengono richiesti tutti gli amici di un determinato utente 
	 che sono attualmente considerati online o per meglio dire "attivi" */

router.post('/onlinefriends', function (req, res) {
	var email = req.cookies.email;
	/* gli amici online non si considerano solo in base allo stato online/offline, ma in base all'ultima azione svolta dall'applicazione
		 dell'amico, qualunque richiesta da parte della sua applicazione aggiorna il valore si lastActionMillis, considero online
		 gli utenti che sono attivi da al massimo 7 minuti (potrebbero anche ascoltare una canzone, e in genere le canzoni durano meno
		 di 5 minuti, ma abbondo con i tempi perché non si può mai sapere) e che hanno state="online" */
	con.query('SELECT u2.first_name AS name, u2.last_name AS surname, u2.email AS email, u2.reproductionSong AS title ' +
						'FROM user AS u1, friendship AS f, user AS u2 ' +
						'WHERE u1.email="' + email + '" AND f.state="confirmed" ' +
						'AND ((f.email_friend1=u1.email AND f.email_friend2=u2.email) OR (f.email_friend1=u2.email AND f.email_friend2=u1.email)) ' +
						'AND u2.state="online" AND u2.lastActionMillis > ' + (((new Date()).getTime()) - 420000) + '', function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		if (result !== null && result.length > 0) {
			var array = [];
			for (var i = 0; i < result.length; i++) {
				var name = result[i].name;
				var surname = result[i].surname;
				var emailFriend = result[i].email;
				var title = result[i].title;
				if (title) {
					array.push({"name": name, "surname": surname, "email": emailFriend, "title": title})
				} else {
					array.push({"name": name, "surname": surname, "email": emailFriend});
				}
			}
			console.log(array);
			res.statusCode = 200;
			res.json(array);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({message: 'Nessun amico attualmente online'});
			return res.end();
		}
	});
});

/* Questa porzione di codice cerca di ottenere tutti gli amici dell'utente che sono
	 attualmente considerati offline o "inattivi" */

router.post('/offlinefriends', function (req, res) {
	var email = req.cookies.email;
	/* gli amici online non si considerano in base allo stato online/offline, ma in base all'ultima azione svolta dall'applicazione
		 dell'amico, qualunque richiesta da parte della sua applicazione aggiorna il valore di lastActionMillis, considero offline
		 gli utenti che sono inattivi da almeno 7 minuti (potrebbero anche ascoltare una canzone, e in genere le canzoni durano meno
		 di 5 minuti, ma abbondo con i tempi perché non si può mai sapere) oppure che hanno impostato lo stato offline */
	con.query('SELECT u2.first_name AS name, u2.last_name AS surname, u2.email AS email ' +
						'FROM user AS u1, user AS u2, friendship AS f ' + /* L'ordine con cui vengono registrati in friendship non si può sapere, quindi considero 2 casi */
						'WHERE u1.email="' + email + '" AND f.state="confirmed" AND ( (f.email_friend1=u1.email AND f.email_friend2=u2.email) OR ' +
						' ( f.email_friend1=u2.email AND f.email_friend2=u1.email ) ) AND ( u2.lastActionMillis < ' + (((new Date()).getTime()) - 420000) +
						' OR u2.state="offline" )' , function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		}
		if (result !== null && result.length > 0) {
			res.statusCode = 200;
			var array = [];
			for (var i = 0; i < result.length; i++) {
				array.push({"name": result[i].name, "surname": result[i].surname, "email": result[i].email});
			}
			res.json(array);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({message: 'Nessun amico attualmente offline'});
			return res.end();
		}
	});
});

/* Questa porzione di codice serve per fare in modo che nel database venga registrata
	 una richiesta di amicizia da parte dell'utente a lato client, verso gli utenti
	 che sono stati trovati tramite la ricerca generica */

router.post('/queryfriendship', function (req, res) {
	var emailDestinatario = req.body.email;
	var emailMittente = req.cookies.email;
	con.query('SELECT u2.first_name AS name FROM user AS u1, user AS u2, friendship AS f ' +
						'WHERE (f.state="waiting" OR f.state="confirmed") AND f.email_friend1="' + emailDestinatario + '" ' +
						'AND f.email_friend2="' + emailMittente + '"', function(err, result) {
		if(err) {
			res.json({error: "Errore nella connnessione con il database"})
			return res.end();
		} else if (result !== null && result.length > 0) {
			res.json({error: "Richiesta già ricevuta o siete già amici"});
			return res.end();
		} else {
			con.query('INSERT INTO friendship (email_friend1, email_friend2, state) VALUES ("' + emailMittente +
								'", "' + emailDestinatario + '", "waiting");', function (err, result) {
				if (err) {
					if (err.code == 'ER_DUP_ENTRY') {
						res.json({error: "Richiesta già inviata o siete già amici"});
					} else {
						res.json({error: "Errore nella connnessione con il database"});
					}
					return res.end();
				} else {
					res.statusCode = 200;
					res.json({message: "Richiesta inviata con successo"});
					res.end();
				}
			});
		}
	});
});

/* Questa porzione di codice serve affinché l'utente possa recuperare le sue
	 attuali richieste di amicizia ricevute, e non inviate, cosicché l'utente 
	 possa successivamente accettarle o rifiutarle */

router.post('/requests', function (req, res) {
	var email = req.body.email;
	con.query('SELECT u2.first_name AS name, u2.last_name AS surname, u2.email AS email ' +
						'FROM user AS u1, user AS u2, friendship AS f ' +
						'WHERE u1.email="' + email + '" AND f.state="waiting" AND f.email_friend2=u1.email ' +
								'AND f.email_friend1=u2.email', function (err, result) {
		if(err) {
			res.json({error: "Errore nella connessione con il database"});
			return res.end();
		} else {
			if (result !== null && result.length > 0) {
				res.statusCode = 200;
				var array = [];
				for (var i = 0; i < result.length; i++) {
					array.push({"name": result[i].name, "surname": result[i].surname, "email": result[i].email});
				}
				console.log(array);
				res.json(array);
				return res.end();
			} else {
				res.statusCode = 404;
				res.json({message: 'Nessuna richiesta in attesa'});
				return res.end();
			}
		}
	});
});

/* Questa porzione di codice viene richiamato quando l'utente decide di accettare
	 una richiesta di amicizia, aggiorna il valore della variabile state della tabella
	 friendship all'interno del database */

router.post('/acceptfriendship', function (req, res) {
	var emailAccettato = req.body.email;
	var emailAccettatore = req.cookies.email;
	/* In questo caso sono sicuro che l'ordine con cui sono scritte le email nella tabella friendship sia quello sottostante */
	con.query('UPDATE friendship SET state="confirmed" WHERE email_friend1="' + emailAccettato +
						'" AND email_friend2="' + emailAccettatore +'";', function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		} else {
			res.statusCode = 200;
			res.json({message: "Amico accettato"});
			res.end();
		}
	});
});

/* Questa porzione di codice viene richiamata quando l'utente decide di rifiutare
	 una richiesta di amicizia, elimina la riga corrispondente alla richiesta di amicizia
	 nella tabella friendship del database */

router.post('/denyfriendship', function (req, res) {
	var emailRifiutato = req.body.email;
	var emailRifiutatore = req.cookies.email;
	/* In questo caso sono sicuro che l'ordine con cui sono scritte le email nella tabella friendship sia quello sottostante */
	con.query('DELETE FROM friendship WHERE email_friend1="' + emailRifiutato +
						'" AND email_friend2="' + emailRifiutatore +'";', function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		} else {
			res.statusCode = 200;
			res.json({message: "Amico rifiutato"});
			res.end();
		}
	});
});

/* Questa porzione di codice serve come la precedente ad eliminare una riga della
	 tabella friendship del database, viene richiamata quando l'utente decide di
	 cancellare una relazione di amicizia con un determinato utente. */

router.post('/delete', function (req, res) {
	var emailUser = req.body.email;
	var email = req.cookies.email;
	con.query('DELETE FROM friendship WHERE (email_friend1="' + email + '" AND email_friend2="' + emailUser + '") ' +
						'OR (email_friend1="' + emailUser + '" AND email_friend2="' + email + '")', function (err, result) {
		if (err) {
			res.json({error: "Errore nella connnessione con il database"});
			return res.end();
		} else {
			res.statusCode = 200;
			res.json({message: "Amico cancellato!"});
			res.end();
		}
	});
});

module.exports = router;