/* Questo snippet rappresenta l'interfaccia che si frappone fra l'applicazione e il server
	 Client e Server comunicano tramite l'oggetto XMLHttpRequest sfruttando degli oggetti JSON */
var serverServices = (function() {
	var url = '', method;

	function httpRequester(data, callback) {
		var xhttp = new XMLHttpRequest();
		xhttp.withCredentials = true;
		xhttp.open(method, url, true);
		xhttp.setRequestHeader('Content-Type', 'application/json; charset=UTF-8');
		xhttp.send(JSON.stringify(data));
		xhttp.onreadystatechange = function() {
			if (xhttp.readyState == 4) {
				var response = JSON.parse(xhttp.response);
				callback(response);
			}
		}
	}

	function verifyUser(email, callback) {
		url = '/verify/verifyuser';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function login(user, callback) {
		url = '/access/login';
		method = 'POST';
		httpRequester(user, callback);
	}

	function signin(user, callback) {
		url = '/access/signin';
		method = 'POST';
		httpRequester(user, callback);
	}

	function logout(email, callback) {
		url = '/access/logout';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function searchSongs(keyword, callback) {
		url = '/search/song';
		method = 'POST';
		httpRequester({keyword}, callback);
	}

	function searchPlaylists(keyword, callback) {
		url = '/search/playlist';
		method = 'POST';
		httpRequester({keyword}, callback);
	}

	function searchUsers(keyword, callback) {
		url = '/search/user';
		method = 'POST';
		httpRequester({keyword}, callback);
	}

	function getOnlineFriends(callback) {
		url = '/friend/onlinefriends';
		method = 'POST'
		httpRequester({}, callback);
	}

	function getOfflineFriends(callback) {
		url = '/friend/offlinefriends';
		method = 'POST';
		httpRequester({}, callback);
	}

	function addFriend(email, callback) {
		url = '/friend/queryfriendship';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function getRequests(email, callback) {
		url = '/friend/requests';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function acceptFriendship(email, callback) {
		url = '/friend/acceptfriendship';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function denyFriendship(email, callback) {
		url = '/friend/denyfriendship';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function deleteFriend(email, callback) {
		url = '/friend/delete';
		method = 'POST';
		httpRequester({email}, callback);
	}

	function searchAllSongs(callback) {
		url = '/song/all';
		method = 'POST';
		httpRequester({}, callback);
	}

	function getMaxIdPlaylist(callback) {
		url = '/playlist/maxid';
		method = 'POST';
		httpRequester({}, callback);
	}
	
	function savePlaylist(data, callback) {
		url = '/playlist/new';
		method = 'POST';
		httpRequester(data, callback);
	}

	function deletePlaylist(id, callback) {
		url = '/playlist/delete';
		method = 'POST';
		httpRequester({id}, callback);
	}

	function getSongPath(id, callback) {
		url = '/song/one';
		method = 'POST';
		httpRequester({id}, callback);
	}

	function showPlaylist(id, callback) {
		url = '/playlist/show';
		method = 'POST';
		httpRequester({id}, callback);
	}

	function setSongContext(data, callback) {
		url = '/song/savecontext';
		method = 'POST';
		httpRequester(data, callback);
	}

	function getSongContext(callback) {
		url = '/song/getcontext';
		method = 'POST';
		httpRequester({}, callback);
	}

	return {verifyUser, login, signin, logout, searchSongs, searchPlaylists, searchUsers, getOnlineFriends,
					getOfflineFriends, addFriend, getRequests, acceptFriendship, denyFriendship, deleteFriend, searchAllSongs,
					getMaxIdPlaylist, savePlaylist, deletePlaylist, getSongPath, showPlaylist, setSongContext, getSongContext};
})();