var express = require('express');
var mysql = require('mysql');
var router = express.Router();
var path = require('path');

var client = path.join('client');
var access = require('./access');

var con = mysql.createConnection({
  host: "localhost",
  user: "gruppo11_admin",
  password: "vagrant"
});

con.query('USE gruppo11', function (err) {
	if (err) throw err;
});

/* Questa porzione di codice viene mandata in esecuzione all'avvio dell'app dell'utente
	 Il suo scopo è quello di verificare che l'utente sia correttamente registrato, altrimenti
	 (a lato client) vengono nascoste tutte le possibilità di svolgere le azioni */

router.post('/verifyuser', function (req, res) {
	var email = req.body.email;
	con.query('SELECT email FROM user WHERE email="' + email + '"', function (err, result) {
		if (err) throw err;
		if (result !== null && result.length > 0) {
			res.statusCode = 200;
			res.json({message: "È collegato"});
			access.setUserOnline(email);
			access.refreshLastAction(email);
			return res.end();
		} else {
			res.statusCode = 404;
			res.json({error: "Utente non registrato"});
			return res.end();
		}
	});
});

module.exports = router;