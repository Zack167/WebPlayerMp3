/* Il vero codice principale del server si trova nella cartella server, 
	 quindi lo richiedo per poterlo eseguire */
var server = require('./server/index.js');
/* Questo metodo serve ad eseguire il server all'indirizzo 192.168.1.55,
	 e resta in ascolto sulla porta 3000 */
server.startServer();