function loginValidate(email) {
	if (!/^[a-zA-Z0-9.!$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
		return {emailUser: "l'email non è valida"};
	}
	return false;
}

function signinValidate(first_name, last_name, email, password) {
	if (first_name.length < 3) {
		return {firstName: "almeno 3 lettere"}
	}
	if (last_name.length < 3) {
		return {lastName: "almeno 3 lettere"}
	}
	if (!/^[a-zA-Z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/.test(email)) {
		return {emailNewUser: "l'email non è valida"};
	}
	if (password.length < 8) {
		return {passwordNewUser: "almeno 8 caratteri"}
	}
	if (!/[0-9]/.test(password)) {
		return {passwordNewUser: "almeno 1 numero"};
	}
	return false;
}

if (typeof module !== 'undefined') {
	module.exports.signinValidate = signinValidate;
}