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

/* Le richieste di login vengono gestite da questa funzione */
router.post("/login", function (req, res) {
	var user = req.body;
	/* Se l'utente è registrato allora il risultato ottenuto sarà unico */
	con.query('SELECT email FROM user WHERE email="' + user.email + '" AND password="' + user.password + '";', function (err, result) {
		if (err) throw err;
		if (result !== null && result.length > 0) {
			/* Quando l'utente si collega innazitutto setto il suo stato ad online */
			con.query('UPDATE user SET state="online" WHERE email="' + user.email + '" ', function (err, result) {
				if (err) {
					res.json({errorMessage: "Errore nel database"});
					return res.end();
				}
				console.log(result.affectedRows + " record(s) updated");
			});
			res.statusCode = 200;
			res.json({email: user.email});
			res.end;
		} else {
			/* Quando l'utente non è registrato non viene trovato nel database */
			res.statusCode = 401;
			res.json({errorMessage: "Non sei registrato"});
			res.end();
		}
	});
});

/* richiedo il file validators.js all'interno della cartella client per verificare anche 
	 a livello server la correttezza delle credenziali inserite */
var validate = require('../client/validators');

router.post('/signin', function(req, res) {
	var user = req.body;

	/* Questa porzione si occupa di verificare che l'utente ha insesito delle informazioni
		 adeguate */
	if (validate.signinValidate(user.name, user.surname, user.email, user.password)) {
		res.statusCode = 400;
		res.json({error: "Il form non è valido"});
		return res.end();
	}
	/* Dopo la verifica l'utente viene registrato all'interno del database */
	con.query('INSERT INTO user (first_name, last_name, email, password, state, lastActionMillis) VALUES ("' + user.name + '", "' + user.surname + '", "' + user.email + '", "' +
		user.password + '", "online", ' + ((new Date()).getTime()) + ' )', function (err, result) {
		if (err) {
			// Nel caso in cui sia già registrato un utente con la mail inserita allora avviso l'utente
			if (err.code === 'ER_DUP_ENTRY') {
				var dupMail = err.sqlMessage.split("\'")[1];
				res.json({errorMail: dupMail + " già in uso" });
				return res.end();
			}
			// problemi nel database
			res.statusCode = 400;
			res.json({error: "Errore nel database"});
			return res.end();
		} else {
			// quando non si verificano problemi di registrazione l'utente potrà collegarsi
			res.statusCode = 200;
			res.json({email: user.email});
			return res.end();
		}
	});
});

/* Quando l'utente ha intenzione di uscire dall'applicazione viene chiamata la seguente applicazione */
router.post('/logout', function (req, res) {
	var email = req.body.email;
	con.query('UPDATE user SET state="offline" WHERE email="' + email + '";', function (err, result) {
		if(err) {
			res.json({error: "Problemi nel logout"});
			return res.end();
		}
		res.statusCode = 200;
		res.json({message: "Ti sei disconnesso correttamente"});
		res.end();
	});
});

module.exports = router;

/* Questi due metodi vengono utilizzati dal file index.js per aggiornare le informazioni sull'utente
	 che ha appena eseguito una richiesta, quali ultimo accesso e stato (online, offline) */

module.exports.setUserOnline = function(email) {
	con.query('UPDATE user SET state="online" WHERE email="' + email + '";', function (err, result) {
		if(err) throw err;
	});
};

module.exports.refreshLastAction = function(email) {
	con.query('UPDATE user SET lastActionMillis=' + (new Date()).getTime() + ' WHERE email="' + email + '";', function (err, result) {
		if(err) throw err;
	});
};