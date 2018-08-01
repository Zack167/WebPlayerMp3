function init() {
	document.getElementById("signin-form").onsubmit = function(event) {signin(event);};
	document.getElementById("login-form").onsubmit = function(event) {login(event);};

	/* Questa funzione mi permette innanzitutto di verificare se i campi inseriti sono validi e
		 dopo richiede al server di effettuare la connessione per l'account registrato nel
		 localStorage */

	function login(event) {
		event.preventDefault();
		var validate = loginValidate(this.emailUser.value);

		if(validate) {
			for (var key in validate) {
				this[key].value = "";
				this[key].placeholder = validate[key];
				// in questo modo gli errori vengono scritti come placeholder
			}
			return;
		}
		localStorage.setItem("email", emailUser.value);
		var email = this.emailUser.value, password = this.passwordUser.value;
		var user = {email, password};
		serverServices.login(user, function(response) {
			if(response.errorMessage) {
				alert(response.errorMessage);
			} else {
				sessionStorage.setItem("email", response.email);
				console.log(response.email);
				document.cookie = "email=" + sessionStorage.getItem("email") + ';';
				window.location.href = window.location.origin;
			}
		});
	}

	/* Questa funzione si comporta esattamente come login, semplicemente opera su più campi,
		 è la funzione che viene utilizzata a lato client che permette ad un nuovo utente di
		 registrarsi */

	function signin(event) {
		event.preventDefault();
		var name = this.firstName.value;
		var surname = this.lastName.value;
		var email = this.emailNewUser.value;
		var password = this.passwordNewUser.value;

		var validate = signinValidate(name, surname, email, password);

		if (validate) {
			for (var key in validate) {
				this[key].value = "";
				this[key].placeholder = validate[key];
				// in questo modo gli errori vengono scritti come placeholder
			}
			return;
		}
		var user = {name, surname, email, password};
		serverServices.signin(user, function(response) {
			if(response.errorField) {
				for (var key in response.errorField) {
					this[key].value = "";
					this[key].placeholder = validate[key];
					// in questo modo gli errori vengono scritti come placeholder
				}
			} else if (response.error) {
				alert('Registrazione fallita: ' + response.error);
			} else {
				localStorage.setItem("email", response.email);
				sessionStorage.setItem("email", response.email);
				document.cookie = "email=" + response.email + ';';
				window.location.href = window.location.origin;
			}
		});
	}
}