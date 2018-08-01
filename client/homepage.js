/* Questa è la coda che astrae la mia playlist, serve per fare in modo
		 che vengano mandate in riproduzione le canzonii una dopo l'altra */

	var queuePlaylist = [];

function init() {
	document.getElementById("logout-btn").onclick = function (event) {logout(event);};

	document.getElementById("searchForm").onsubmit = function (event) {genericSearch(event);};

	document.getElementById("createPlaylistBtn").onclick = function(event) {createPlaylist(event);};

	document.getElementById("showFriendsListIcon").onclick = function(event) {openFriendsSection(event)};

	document.getElementById("center-to-friend").onclick = function(event) {
		showFriendsSection();
		openFriendsSection(event);
	};

	document.getElementById("search-to-friend").onclick = function(event) {
		showFriendsSection();
		openFriendsSection(event);
	};

	document.getElementById("hideFriendsListIcon").onclick = function(event) {closeFriendsSection(event)};

	document.getElementById("requests-btn").onclick = function(event) {getFriendshipRequests(event)}

	/* In questo modo quando l'utente esce dalla pagina viene salvato la sua canzone */
	window.onunload = window.onbeforeunload = function (event) {
		if (typeof event == 'undefined') {
			event = window.event;
			}
		if (event) {
			if (event.type == "unload" && event.returnValue) {
				if (sessionStorage.getItem("songInReproductionId")) {
					saveSongContext(parseInt(sessionStorage.getItem("songInReproductionId")), false);
				}
			}
		}
		return;
	};

	var friendsSection = document.getElementById("friendsSection");

	/* function setReproductionSong() {
		serverServices.getReproductionSong(function (response) {

		});
	}

	controlReproductionSong(); */

	// window.addEventListener("beforeunload", logout(event));

	/* Quando l'utente entra nel sito la prima cosa da fare è verificare se ha un email registrata e se corrisponde
		 all'email di un utente registrato, altrimenti non potrà effettuare alcuna azione all'interno della
		 applicazione, pertanto dovrà cliccare sul bottone INIZIA per procedere con la fase di login o signin */
	function verifyUser() {
		serverServices.verifyUser(localStorage.getItem("email"), function (response) {
			if (response.error) {
				document.getElementById("logout-btn").style.display = "none";
				document.getElementById("requests-btn").style.display = "none";
				document.getElementById("createPlaylistBtn").style.display = "none";
				var centralArea = document.getElementById("centralArea");
				while(centralArea.firstChild) {
					centralArea.removeChild(centralArea.firstChild);
				}
				/* Necessario per allineare il bottone al centro dell'area centrale */
				centralArea.style = "display:flex; justify-content:center; align-items:center;" 
				var toWelcomePageButton = document.createElement('button');
				toWelcomePageButton.id = "welcomePageBtn";
				/* Quando premo il bottone questo deve mandarmi nella welcome page */
				toWelcomePageButton.onclick = function (event) {goToWelcomePage(event);}
				toWelcomePageButton.appendChild(document.createTextNode("INIZIA!"));
				centralArea.appendChild(toWelcomePageButton);
			} else {
				// in questo modo salvo la mail dell'utente nei cookie di questa pagina
				document.cookie = "email=" + localStorage.getItem("email");
				// se l'utente è riuscito a connettersi allora carico la sua ultima canzone
				getSongContext();
			}
		});
	}

	// lo mando subito in esecuzione
	verifyUser();

	// Il bottone INIZIA permette di andare alla WelcomePage per registrarsi
	function goToWelcomePage(event) {
		window.location.href = window.location.origin + '/welcomepage.html';
	}

	/* Questa funzione ha lo scopo di permettere all'utente di effettuare il logout dell'utente
		 attualmente connesso, viene richiamato dal bottone in alto a destra dell'applicazione */

	function logout(event) {
		event.preventDefault();
		var email = localStorage["email"];
		serverServices.logout(email, function (response) {
			if(response.error) {
				alert(response.error);
			} else {
				if (sessionStorage.getItem("songInReproductionId")) {
					saveSongContext(parseInt(sessionStorage.getItem("songInReproductionId")), true);
				}
				sessionStorage.removeItem("email");
				document.cookie = "email=";
				document.location.href = document.location.origin + '/welcomepage.html';
			}
		});
	}

	/* La funzione di ricerca generica si occupa di controllare se nel database del server
		 esistono dei match per la parola chiave digitata dall'utente, in termini di canzoni,
		 playlist e utenti registrati */
	function genericSearch(event) {
		event.preventDefault();
		var keyword = this.keyword.value;
		// per cancellare i risultati precedenti, se ci sono
		var resultsNode = document.getElementById("results");
		while (resultsNode.firstChild) {
			resultsNode.removeChild(resultsNode.firstChild);
		}

		/* Nel caso in cui l'utente non digiti nulla, allora lo informo di inserire
			 almeno un valore nel campo di ricerca */
		if(keyword == '') {
			var El = document.createElement('div');
			El.classList.add("result", "not-found");
			var text = 'Inserisci qualcosa e poi clicca su "cerca"';
			El.appendChild(document.createTextNode(text));
			resultsNode.appendChild(El);
			return;
		}

		// per cercare le playlist
		serverServices.searchPlaylists(keyword, function (response) {
			if(response.error) {
				alert("Si è presentato un errore: " + response.error);
				return;
			} else {
				/* Innanzitutto inserisco la barra delle playlist */
				var playlistIntro = document.createElement('div');
				playlistIntro.innerHTML = "Playlist";
				playlistIntro.classList.add("intro");
				resultsNode.appendChild(playlistIntro);
				if (response.message) {
					/* quando non sono state trovate playlist corrispondenti
						 creo un elemento per informare l'utente della mancanza
						 di una playlist corrispondente */
					var playlistEl = document.createElement('div');
					playlistEl.classList.add("result", "not-found");
					var text = response.message;
					playlistEl.appendChild(document.createTextNode(text));
					resultsNode.appendChild(playlistEl);
				} else {
					// i risultati potrebbero essere molteplici
					for (var i = 0; i < response.length; i++) {
						var playlistEl = document.createElement('div');
						playlistEl.classList.add("result");
						var text = response[i].title;
						var id = response[i].id;
						var getAndShowPlaylistBtn = document.createElement("button");
						var getAndShowPlaylistIcon = document.createElement("i");
						getAndShowPlaylistIcon.classList.add("fa", "fa-server");
						getAndShowPlaylistBtn.id = "playlist-btn-" + id;
						getAndShowPlaylistBtn.classList = "searchButtons";
						getAndShowPlaylistBtn.appendChild(getAndShowPlaylistIcon);
						playlistEl.appendChild(getAndShowPlaylistBtn);
						var textDiv = document.createElement('div');
						textDiv.appendChild(document.createTextNode(text));
						textDiv.classList.add("text");
						playlistEl.appendChild(textDiv);
						resultsNode.appendChild(playlistEl);
						/* Ogni bottone permette di mostrare la playlist corrispondente in base al suo id */
						document.getElementById(getAndShowPlaylistBtn.id).onclick = function(event) {
							event.preventDefault();
							showPlaylist(this.id.split('-')[2]);
						};
					}
				}
			}
		});

		// per cercare le canzoni
		serverServices.searchSongs(keyword, function (response) {
			if(response.error) {
				alert("Si è presentato un errore: " + response.error);
				return;
			} else {
				/* Innanzitutto inserisco la barra delle canzoni */
				var songIntro = document.createElement('div');
				songIntro.innerHTML = "Brani";
				songIntro.classList.add("intro");
				resultsNode.appendChild(songIntro);
				if (response.message) {
					/* quando non sono state trovate canzoni corrispondenti
						 creo un elemento per informare l'utente della mancanza
						 di una canzone corrispondente */
					var songEl = document.createElement('div');
					songEl.classList.add("result", "not-found");
					var text = response.message;
					songEl.appendChild(document.createTextNode(text));
					resultsNode.appendChild(songEl);
				} else {
					// i risultati potrebbero essere molteplici
					for (var i = 0; i < response.length; i++) {
						var songEl = document.createElement('div');
						songEl.classList.add("result");
						var text = response[i].title + " - " + response[i].author;
						var id = response[i].id;
						var playSongBtn = document.createElement("button");
						var playSongIcon = document.createElement("i");
						playSongIcon.classList.add("fa", "fa-play");
						playSongBtn.id = "song-btn-" + response[i].id;
						playSongBtn.classList = "searchButtons";
						playSongBtn.appendChild(playSongIcon);
						songEl.appendChild(playSongBtn);
						var textDiv = document.createElement('div');
						textDiv.appendChild(document.createTextNode(text));
						textDiv.classList.add("text");
						songEl.appendChild(textDiv);
						resultsNode.appendChild(songEl);
						/* Ogni bottone mi permette di mandare in esecuzione una canzone in base al suo id*/
						playSongBtn.onclick = function(event) {
							event.preventDefault();
							playOneSong(this.id.split('-')[2]);
						};
					}
				}
			}
		});

		/* per cercare gli utenti, eccetto l'utente che richiede questa funzione,
			 altrimenti potrebbe mandare una richiesta d'amicizia a se stesso */
		serverServices.searchUsers(keyword, function (response) {
			if(response.error) {
				alert("Si è presentato un errore: " + response.error);
				return;
			} else {
				var userIntro = document.createElement('div');
				userIntro.innerHTML = "Utenti";
				userIntro.classList.add("intro");
				resultsNode.appendChild(userIntro);
				if (response.message) {
					var songEl = document.createElement('div');
					songEl.classList.add("result", "not-found");
					var text = response.message;
					songEl.appendChild(document.createTextNode(text));
					resultsNode.appendChild(songEl);
				} else {
					// i risultati potrebbero essere molteplici
					for (var i = 0; i < response.length; i++) {
						var userEl = document.createElement('div');
						userEl.classList.add("result");
						var text = response[i].name + " " + response[i].surname;
						var requireFriendshipBtn = document.createElement("button");
						var requireFriendshipIcon = document.createElement("i");
						requireFriendshipIcon.classList.add("fa", "fa-send-o");
						/* Salvo la mail dell'utente all'interno del sessionStorage perché può servire
							 per mandargli una richiesta di amicizia, e viene cancellata al termine
							 della sessione dell'utente connesso */
						sessionStorage.setItem("emailUser-" + i, response[i].email);
						requireFriendshipBtn.id = "userBtn-" + i;
						requireFriendshipBtn.classList = "searchButtons";
						requireFriendshipBtn.appendChild(requireFriendshipIcon);
						userEl.appendChild(requireFriendshipBtn);
						var textDiv = document.createElement('div');
						textDiv.appendChild(document.createTextNode(text));
						textDiv.classList.add("text");
						userEl.appendChild(textDiv)
						resultsNode.appendChild(userEl);
						/* Ogni bottone permette di chiedere l'amicizia ad un utente tramite la sua email
							 che è stata salvara all'interno del sessionStorage */
						document.getElementById(requireFriendshipBtn.id).onclick = function(event) {
							event.preventDefault();
							addFriend(sessionStorage.getItem("emailUser-" + this.id.split('-')[1]));
						};
					}
				}
			}
		});
	}

	/* è la funzione che viene eseguita per mandare in esecuzione una canzone trovata
		 tramite la schermata di ricerca */

	function playOneSong(idSong) {
		serverServices.getSongPath(idSong, function (response) {
			if (response.error) {
				alert("Errore nel cercare la canzone: " + response.error);
				return;
			} else {
				sessionStorage.setItem("songInReproductionId", idSong);
				var audioTag = document.getElementById("reproductionSong");
				if (document.getElementById('songInReproduction')) {
					audioTag.removeChild(document.getElementById('songInReproduction'));
				}
				var songInfoEl = document.getElementById("songInfo");
				if (songInfoEl.firstChild) {
					songInfoEl.removeChild(songInfoEl.firstChild);
				}
				var songEl = document.createElement('source');
				songEl.id = "songInReproduction";
				songEl.type = "audio/mpeg";	
				var text = response.title + " - " + response.author;
				var path = response.path;
				songInfoEl.appendChild(document.createTextNode(text));
				songEl.src = path;
				console.log(text);
				audioTag.appendChild(songEl);
				audioTag.load();
				audioTag.oncanplay = function (event) {event.preventDefault(); audioTag.play()};
				audioTag.onpause = function (event) {event.preventDefault(); saveSongContext(parseInt(sessionStorage.getItem("songInReproductionId")), false);};
				/* se stavo ascoltando una playlist allora onended sarebbe settato per far ascoltare la canzone successiva
					 ma in questo caso voglio che non venga caricato nessun nuovo brano dopo questo */
				audioTag.onended = null;
			}
		});
	}

	/* Questa è la funzione che viene chiamata per chiedere al server di salvare l'ultima canzone attualmente
		 in riproduzione da parte dell'utente attualmente connesso */

	function saveSongContext(idSong, isLogout) {
		// Quando l'utente non ha alcuna canzone salvata
		if (!document.getElementById("songInReproduction")) {return;}
		var audioTag = document.getElementById("reproductionSong");
		// Non conviene utilizzare audioTag.played.end(0)
		// var pausedTime = parseInt(audioTag.played.end(0) * 1000);
		// L'utente potrebbe disconnettersi prima di mandare in play la canzone
		if (isLogout === true) {audioTag.pause();}
		var pausedTime = parseInt(audioTag.currentTime * 1000);
		serverServices.setSongContext({idSong, pausedTime}, function (response) {
			return;
		});
	}

	/* Questa è la funzione che viene chiamata quando l'utente si è appena connesso per recuperare le informazioni
		 sulla canzone attualmente registrata nella sua riga nella tabella user del database */

	function getSongContext() {
		var audioTag = document.getElementById("reproductionSong");
		serverServices.getSongContext(function (response) {
			if (response.message) {
				return;
			} else {
				console.log("mi chiama");
				sessionStorage.setItem("songInReproductionId", response.idSong);
				var songEl = document.createElement('source');
				songEl.id = "songInReproduction";
				songEl.type = "audio/mpeg";	
				var text = response.title + " - " + response.author;
				var path = response.path;
				var songInfoEl = document.getElementById("songInfo");
				songInfoEl.appendChild(document.createTextNode(text));
				songEl.src = path;
				console.log(text);
				audioTag.appendChild(songEl);
				audioTag.currentTime = parseInt(response.pausedTime) / 1000;
				audioTag.load();
				// Decide l'utente se mandare in play la canzone
				audioTag.onpause = function (event) {event.preventDefault(); saveSongContext(parseInt(sessionStorage.getItem("songInReproductionId")), false);};
				/* se stavo ascoltando una playlist allora onended sarebbe settato per far ascoltare la canzone successiva
					 ma in questo caso voglio che non venga caricato nessun nuovo brano dopo questo */
				audioTag.onended = null;
			}
		});
	}

	/* Quando l'utente decide di creare una playlist viene richiamata questa funzione */

	function createPlaylist(event) {
		event.preventDefault();
		if(window.innerWidth < 750) showCentralSection();
		
		var playlistBox = document.getElementById('playlist-box');

		// nel caso ci siano altro nell'area centrale, prima lo eliminiamo
		while (playlistBox.firstChild) {
			playlistBox.removeChild(playlistBox.firstChild);
		}
		/* Richiedo al server tutte le informazioni sulle canzoni presenti nel sistema */
		serverServices.searchAllSongs(function (response) {
			var newPlaylistForm = document.createElement('form');
			newPlaylistForm.id = "newPlaylistForm";
			var titleSection = document.createElement('div');
			titleSection.id = "titleSection";
			var titleField = document.createElement('input');
			titleField.type = "text";
			titleField.name = "newPlaylistName";
			titleField.id = "newPlaylistTitle";
			titleField.placeholder = "Titolo Playlist";
			titleField.required = "required";
			titleSection.appendChild(titleField);
			newPlaylistForm.appendChild(titleSection);
			if (response.message) {
				// quando si presenta un problema, non permetto all'utente di creare la playlist
				var songEl = document.createElement('div');
				songEl.classList.add("result", "not-found");
				var text = response.message;
				songEl.appendChild(document.createTextNode(text));
				newPlaylistForm.appendChild(songEl);
				return;
			} else {
				/* Per ogni canzone contenuta nel database, genero una nuova riga che mi permette di selezionare
					 la canzone corrispondente */
				for (var i = 0; i < response.length; i++) {
					var songEl = document.createElement('div');
					var checkBox = document.createElement('div');
					var songInfoEl = document.createElement('div');
					songEl.classList.add('result');
					checkBox.classList.add('squareBox');
					var checkboxSong = document.createElement('input');
					checkboxSong.type = "checkbox";
					checkboxSong.value = response[i].id;
					checkboxSong.classList.add("songsCheckbox");
					checkBox.appendChild(checkboxSong);
					songInfoEl.classList.add("songInfoEl");
					songInfoEl.appendChild(document.createTextNode(response[i].title));
					songInfoEl.appendChild(document.createElement("br"));
					songInfoEl.appendChild(document.createTextNode(response[i].author));
					songEl.appendChild(checkBox);
					songEl.appendChild(songInfoEl);
					newPlaylistForm.appendChild(songEl);
				}
				/* Una volta terminato genero i bottoni per permettere il salvataggio della playlist
					 oppure per annullare l'operazione */
				var buttonsDiv = document.createElement('div');
				buttonsDiv.classList.add("result");
				var savePlaylistButton = document.createElement("input");
				savePlaylistButton.type = "submit";
				savePlaylistButton.value = "Salva";
				savePlaylistButton.classList.add("submit");
				var cancelButton = document.createElement("button");
				cancelButton.appendChild(document.createTextNode("Annulla"));
				cancelButton.classList.add("submit");
				cancelButton.id = "cancelButton";
				buttonsDiv.appendChild(savePlaylistButton);
				buttonsDiv.appendChild(cancelButton);
				newPlaylistForm.appendChild(buttonsDiv);
				// è il bottone del submit che mi permette di salvare la playlist
				newPlaylistForm.onsubmit = function (event) {savePlaylist(event);};
				cancelButton.onclick = function (event) {cancelPlaylist(event);};
			}
			playlistBox.appendChild(newPlaylistForm);
		});
	}

	/* Questa funzione permette di salvare la playlist appena generata dall'utente */
	function savePlaylist(event) {
		event.preventDefault();
		var newPlaylistTitle = document.getElementById("newPlaylistTitle");
		var idSongs = [];
		var elements = document.getElementsByClassName("songsCheckbox");
		var checked = false;
		// se non viene selezionata almeno una canzone non si può proseguire con la richiesta
		for (var i = 0; i < elements.length; i++) {
			if (elements[i].checked) {
				checked = true;
				idSongs.push(parseInt(elements[i].value));
			}
		}
		/* Se è stata selezionata almeno una canzone per la nuova playlist */
		if (checked == true) {
			/* Prima di tutto recupero l'id di valore più alto per le playlist */
			serverServices.getMaxIdPlaylist(function(response) {
				if (response.error) {
					alert("C'è stato un problema nel salvataggio: " + response.error);
					return;
				} else {
					var id = parseInt(response.id) + 1;
					console.log(id);
					var title = newPlaylistTitle.value;
					serverServices.savePlaylist({id, title, idSongs}, function (response) {
						if (response.error) {
							alert("C'è stato un problema nel salvataggio: " + response.error);
							return;
						} else {
							alert("Playlist salvata con successo!");
							var playlistBox = document.getElementById("playlist-box");
							while (playlistBox.firstChild) {
								playlistBox.removeChild(playlistBox.firstChild);
							}
							return;
						}
					});
				}
			});
		} else {
			alert("Seleziona almeno una canzone");
			return;
		}
	}

	/* Quando l'utente decide di annullare la creazione di una playlist viene semplicemente
		 liberata la sezione centrale per poter essere riutilizzata diversamente */

	function cancelPlaylist(event) {
		event.preventDefault();
		var playlistBox = document.getElementById("playlist-box");
		while (playlistBox.firstChild) {
			playlistBox.removeChild(playlistBox.firstChild);
		}
	}

	/* Questa è la funzione che permette di visualizzare la playlist, in questo modo
		 l'utente può selezionare una delle canzoni contenute al suo interno e 
		 mandarla in esecuzione, per poter eseguire la playlist in modo continuo */

	function showPlaylist(idPlaylist) {
		serverServices.showPlaylist(idPlaylist, function (response) {
			if (response.error) {
				alert("Problema nella visualizzazione della playlist: " + response.error);
				return;
			} else {
				if (window.innerWidth < 750) showCentralSection();
				var playListBox = document.getElementById("playlist-box");
				// Per rimuovere quello che si trova già dentro
				while(playListBox.firstChild) {
					playListBox.removeChild(playListBox.firstChild);
				}
				sessionStorage.setItem("actualPlaylistId", idPlaylist);
				var playlistList = document.createElement('div');
				playlistList.id = "playlistList";
				var titlePlaylist = document.createElement('div');
				titlePlaylist.id = "titleSection";
				titlePlaylist.appendChild(document.createTextNode(response.title));
				if (response.public === "false") {
					/* Nel caso in cui la playlist sia personale, l'utente può cancellarla
						 quindi devo permetterglielo attraverso l'apposito bottone */ 
					var deletePlaylistBtn = document.createElement('button');
					var deletePlaylistIcon = document.createElement('i');
					deletePlaylistIcon.classList.add("fa", "fa-close");
					deletePlaylistBtn.id = "deletePlaylistBtn";
					deletePlaylistBtn.appendChild(deletePlaylistIcon);
					deletePlaylistBtn.onclick = function(event) {
						event.preventDefault();
						deletePlaylist(parseInt(sessionStorage.getItem("actualPlaylistId")))
					};
					titlePlaylist.appendChild(deletePlaylistBtn);
				}
				playListBox.appendChild(titlePlaylist);
				// azzero la coda della playlist precedente
				queuePlaylist = [];
				for (var i = 0; i < (response.songs).length; i++) {
					queuePlaylist.push((response.songs)[i].song_id);
					var songEl = document.createElement('div');
					var playBox = document.createElement('div');
					var songInfoEl = document.createElement('div');
					songEl.classList.add('result');
					playBox.classList.add('squareBox');
					var playSongBtn = document.createElement('button');
					var playSongIcon = document.createElement('i');
					playSongBtn.classList.add("playlistPlayButton");
					playSongIcon.classList.add("fa", "fa-play");
					playSongBtn.appendChild(playSongIcon);
					playSongBtn.id = "songBtn-" + i;
					// per mandare in riproduzione il brano dalla coda
					playSongBtn.onclick = function (event, i) {
						event.preventDefault();
						playPlaylist(parseInt(this.id.split('-')[1]));
					}
					playBox.appendChild(playSongBtn);
					songInfoEl.classList.add("songInfoEl");
					songInfoEl.appendChild(document.createTextNode((response.songs)[i].song_title));
					songInfoEl.appendChild(document.createElement("br"));
					songInfoEl.appendChild(document.createTextNode((response.songs)[i].author));
					songEl.appendChild(playBox);
					songEl.appendChild(songInfoEl);
					playlistList.appendChild(songEl);
				}
				playListBox.appendChild(playlistList);
			}
		});
	}

	/* Quando viene mandata in play una canzone della playlist, viene richiamata questa funzione,
		 che permette di riprodurre le canzoni contenute nella playlist stessa in loop, a meno che
		 l'utente non le interrompa */
	function playPlaylist(sequenceInPlaylist) {
		var nextSongInSequence = 0;
		console.log(queuePlaylist);
		// Se sono arrivato all'ultima canzone, la successiva sarà la prima della coda
		if (sequenceInPlaylist === queuePlaylist.length - 1) {
			nextSongInSequence = 0;
		} else {
			nextSongInSequence = 1 + sequenceInPlaylist;
		}

		console.log(nextSongInSequence);
		
		serverServices.getSongPath(queuePlaylist[sequenceInPlaylist], function (response) {
			if (response.error) return;
			else {
				sessionStorage.setItem("songInReproductionId", queuePlaylist[sequenceInPlaylist]);
				sessionStorage.setItem("nextSongInSequence", nextSongInSequence);

				var audioTag = document.getElementById("reproductionSong");
				// rimuovo la canzone attualmente in esecuzione, se c'è
				if (document.getElementById('songInReproduction')) {
					audioTag.removeChild(document.getElementById('songInReproduction'));
				}
				var songInfoEl = document.getElementById("songInfo");
				if (songInfoEl.firstChild) {
					songInfoEl.removeChild(songInfoEl.firstChild);
				}
				var songEl = document.createElement('source');
				songEl.id = "songInReproduction";
				songEl.type = "audio/mpeg";	
				var text = response.title + " - " + response.author;
				var path = response.path;
				songInfoEl.appendChild(document.createTextNode(text));
				songEl.src = path;
				audioTag.appendChild(songEl);
				audioTag.load();
				audioTag.oncanplay = function (event) {event.preventDefault(); audioTag.play()};
				audioTag.onpause = function (event) {event.preventDefault(); saveSongContext(parseInt(sessionStorage.getItem("songInReproductionId")), false);};
				/* Per fare in modo che finita la canzone attuale parta la successiva della playlist */
				audioTag.onended = function (event) {event.preventDefault(); playPlaylist(parseInt(sessionStorage.getItem("nextSongInSequence")))};
			}
		})
	}

	/* Se la playlist è una di quelle personali dell'utente, allora sarà possibile eliminarla tramite
		 l'apposito pulsante che richiama questa funzione */
	function deletePlaylist(id) {
		console.log(id);
		serverServices.deletePlaylist(id, function (response) {
			if (response.error) {
				alert("Errore nella connessione");
				return;
			} else {
				// affinché l'utente non possa premere sul bottone per mostrare la
				// playlist che ha appena rimosso, altrimenti riceverebbe un errore
				var resultsNode = document.getElementById("results");
				while (resultsNode.firstChild) {
					resultsNode.removeChild(resultsNode.firstChild);
				}
				var playListBox = document.getElementById("playlist-box");
				// Per rimuovere quello che si trova già dentro
				while(playListBox.firstChild) {
					playListBox.removeChild(playListBox.firstChild);
				}
			}
		});
	}

	/* Questa funzione viene richiamata quando l'utente clicca sul bottone per aggiungere
		 un amico nella sezione di ricerca */
	function addFriend(emailNewFriend) {
		serverServices.addFriend(emailNewFriend, function (response) {
			if (response.error) {
				alert(response.error);
			} else {
				// se la richiesta di amicizia è già presente o sono già amici
				alert(response.message);
			}
		});
	}

	/* Questa funzione viene richiamata quando l'utente clicca sul bottone delle richieste
		 di amicizia, e viene utilizzata come refresh dopo aver risposto ad una richiesta
		 di amicizia */
	function getFriendshipRequests(event) {
		event.preventDefault();
		var requestBox = document.getElementById("requests-box");
		requestBox.style.display = "block";

		// eliminiamo il contenuto precedente, se c'è
		while(requestBox.firstChild) {
			requestBox.removeChild(requestBox.firstChild);
		}

		serverServices.getRequests(localStorage.getItem("email"), function (response) {
			if (response.error) {
				alert(response.error);
			} else if (response.message) {
				// quando non sono presenti nuove richieste di amicizia nel db
				var friendRequestEl = document.createElement('div');
				friendRequestEl.classList.add("result", "not-found");
				var text = response.message;
				friendRequestEl.appendChild(document.createTextNode(text));
				requestBox.appendChild(friendRequestEl);	
			} else {
				/* Potrebbero esserci più richieste di amicizia, pertanto
					 dobbiamo poterle mostrare tutte */
				for(var i = 0; i < response.length; i++) {
					var text = response[i].name + " " + response[i].surname;
					var friendRequestEl = document.createElement('div');
					var confirmButton = document.createElement('button');
					var confirmIcon = document.createElement('i');
					var denyButton = document.createElement('button');
					var denyIcon = document.createElement('i');

					friendRequestEl.classList.add("result");
					confirmButton.classList.add("requestButtons");
					denyButton.classList.add("requestButtons");
					confirmIcon.classList.add("fa", "fa-check");
					denyIcon.classList.add("fa", "fa-close");
					/* Salvo le email di ogni utente che richiede l'amicizia all'interno del sessionStorage */
					sessionStorage.setItem("emailFriendRequest-" + i, response[i].email);
					confirmButton.id = "confirmBtn-" + i;
					denyButton.id = "denyBtn-" + i;

					confirmButton.appendChild(confirmIcon);
					denyButton.appendChild(denyIcon);

					friendRequestEl.appendChild(document.createTextNode(text));
					friendRequestEl.appendChild(denyButton);
					friendRequestEl.appendChild(confirmButton);

					requestBox.appendChild(friendRequestEl);
					/* I bottoni di accettazione richiamano la funzione di accettazione di una richiesta di amicizia,
						 ogni richiesta, e quindi ogni bottone, ha un numero salvato al suo interno, utilizzato per
						 recuperare la mail corretta per l'amico in questione */
					document.getElementById(confirmButton.id).onclick = function(event) {
						event.preventDefault();
						acceptFriendship(sessionStorage.getItem("emailFriendRequest-" + this.id.split('-')[1]));
						sessionStorage.removeItem("emailFriendRequest-" + this.id.split('-')[1]);
						getFriendshipRequests(event);

					}
					/* I bottoni di negazione richiamano la funzione di negazione di una richiesta di amicizia,
						 ogni richiesta, e quindi ogni bottone, ha un numero salvato al suo interno, utilizzato per
						 recuperare la mail corretta per l'amico in questione */
					document.getElementById(denyButton.id).onclick = function(event) {
						event.preventDefault();
						denyFriendship(sessionStorage.getItem("emailFriendRequest-" + this.id.split('-')[1]));
						sessionStorage.removeItem("emailFriendRequest-" + this.id.split('-')[1]);
						getFriendshipRequests(event);
					}
				}
			}
		});
		/* A questo punto devo cambiare la funzione del bottone per le richiesta in maniera tale
			 che chiuda la sezione delle richieste di amicizia */
		document.getElementById("requests-btn").onclick = function(event) {hideRequestBox(event)};
	}

	/* Svolge il compito opposto della funzione precedente */

	function hideRequestBox(event) {
		event.preventDefault();
		var requestBox = document.getElementById("requests-box");
		requestBox.style = "";
		/* A questo punto devo cambiare la funzione del bottone per le richiesta in maniera tale
			 che apra la sezione delle richieste di amicizia */
		document.getElementById("requests-btn").onclick = function(event) {getFriendshipRequests(event)};
	}

	/* Quando un utente decide di accettare una richiesta di amicizia e clicca sul bottone
		 correlato, viene eseguita questa funzione, il server si occupa di questa problematica */

	function acceptFriendship(emailNewFriend) {
		serverServices.acceptFriendship(emailNewFriend, function (response) {
			if (response.error) {
				alert(response.error);
			} else {
				alert(response.message);
			}
		});
	}

	/* Quando un utente decide di rifiutare una richiesta di amicizia e clicca sul bottone
		 correlato,  viene eseguita questa funzione, il server si occupa di questa problematica */

	function denyFriendship(emailNewFriend) {
		serverServices.denyFriendship(emailNewFriend, function (response) {
			if (response.error) {
				alert(response.error);
			} else {
				alert(response.message);
			}
		});
	}

	/* Quando l'utente vuole visualizzare la lista dei propri amici esegue questa funzione,
		 che esegue due richieste al server per ottenere le due liste di amici attivi e di amici
		 non attivi, nel primo caso viene richiesto anche il titolo della canzone che un amico
		 potrebbe avere in riproduzione in quel momento */

	function openFriendsSection(event) {
		event.preventDefault();
		// le classi minimize e maximize servono per la corretta visualizzazione nei pc
		friendsSection.classList.remove("minimize");
		friendsSection.classList.add("maximize");
		document.getElementById("hideFriendsListIcon").style.display = "block";
		document.getElementById("showFriendsListIcon").style.display = "none";
		var friendsListDiv = document.getElementById("friendsListDiv");
		friendsListDiv.style.display = "block";

		while (friendsListDiv.firstChild) {
			friendsListDiv.removeChild(friendsListDiv.firstChild);
		}

		var onlineFriends = document.createElement('div');

		// prima di tutto richiediamo gli amici attualmente online
		serverServices.getOnlineFriends(function (response) {
			var friendsOnlineIntro = document.createElement('div');
			friendsOnlineIntro.innerHTML = "Amici online";
			friendsOnlineIntro.classList.add("intro");
			onlineFriends.appendChild(friendsOnlineIntro);
			if (response.error) {
				// problemi nel database
				alert("si è presentato un errore " + response.error);
				return;
			}
			if (response.message) {
				// nessun amico online
				var friendEl = document.createElement('div');
				friendEl.classList.add("result", "not-found");
				var text = response.message;
				friendEl.appendChild(document.createTextNode(text));
				onlineFriends.appendChild(friendEl);
			} else {
				// c'è qualche amico online
				for (var i = 0; i < response.length; i++) {
					// per ogni amico abbiamo un blocco di informazioni
					var friendEl = document.createElement('div');
					friendEl.classList.add("result");
					
					var text = response[i].name + " " + response[i].surname;
					/* se abbiamo ottenuto l'informazione sulla canzone in riproduzione
						 allora la mostriamo a schermo, altrimenti saltiamo questa opzione */
					if (response[i].title) {
						text += " - " + response[i].title;
					}
					var textDiv = document.createElement('div');
					textDiv.appendChild(document.createTextNode(text));
					textDiv.classList.add("text");
					friendEl.appendChild(textDiv);

					sessionStorage.setItem("onlineFriendEmail-" + i, response[i].email);

					/* Ogni blocco per un amico contiene un bottone per cancellare
						 l'amico dall'insieme di amici dell'utente */
					
					var deleteFriendBtn = document.createElement("button");
					var deleteFriendIcon = document.createElement("i");
					deleteFriendIcon.classList.add("fa", "fa-close");
					deleteFriendBtn.id = "onlineFriendBtn-" + i;
					deleteFriendBtn.classList.add("deleteButtons");
					deleteFriendBtn.appendChild(deleteFriendIcon);

					friendEl.appendChild(deleteFriendBtn);

					onlineFriends.appendChild(friendEl);
					deleteFriendBtn.onclick = function(event) {
						deleteFriend(sessionStorage.getItem("onlineFriendEmail-" + this.id.split('-')[i]), event);
						sessionStorage.removeItem("onlineFriendEmail-" + this.id.split('-')[i]);
						openFriendsSection(event);
					}
				}
			}
			friendsListDiv.appendChild(onlineFriends);
		});

		/* Oltre agli amici online richiediamo la lista degli amici che non sono online
			 e di questi non visualizziamo la loro canzone attualmente in riproduzione */

		var offlineFriends = document.createElement('div');

		serverServices.getOfflineFriends(function (response) {
			var friendsOfflineIntro = document.createElement('div');
			friendsOfflineIntro.innerHTML = "Amici offline";
			friendsOfflineIntro.classList.add("intro");
			offlineFriends.appendChild(friendsOfflineIntro);
			if (response.error) {
				// problemi nel database
				alert("si è presentato un errore " + response.error);
				return;
			}
			if (response.message) {
				// nessun amico offline
				var friendEl = document.createElement('div');
				friendEl.classList.add("result", "not-found");
				var text = response.message;
				friendEl.appendChild(document.createTextNode(text));
				offlineFriends.appendChild(friendEl);
			} else {
				// c'è qualche amico offline
				for (var i = 0; i < response.length; i++) {
					// per ogni amico abbiamo un blocco di informazioni
					var friendEl = document.createElement('div');
					friendEl.classList.add("result");

					sessionStorage.setItem("offlineFriendEmail-" + i, response[i].email);

					/* Ogni blocco per un amico contiene un bottone per cancellare
						 l'amico dall'insieme di amici dell'utente */
					
					var deleteFriendBtn = document.createElement("button");
					var deleteFriendIcon = document.createElement("i");
					deleteFriendIcon.classList.add("fa", "fa-close");
					deleteFriendBtn.id = "offlineFriendBtn-" + i;
					deleteFriendBtn.classList.add("deleteButtons");
					deleteFriendBtn.appendChild(deleteFriendIcon);

					friendEl.appendChild(document.createTextNode(response[i].name + " " + response[i].surname));
					friendEl.appendChild(deleteFriendBtn);

					offlineFriends.appendChild(friendEl);

					deleteFriendBtn.onclick = function(event) {
						deleteFriend(sessionStorage.getItem("offlineFriendEmail-" + this.id.split('-')[i]), event);
						sessionStorage.removeItem("offlineFriendEmail-" + this.id.split('-')[i]);
						openFriendsSection(event);
					}
				}
			}
			friendsListDiv.appendChild(offlineFriends);
		});
	}

	/* Quando l'utente clicca sul bottone per chiudere la sezione degli amici
		 viene eseguita questa funzione */

	function closeFriendsSection(event) {
		event.preventDefault();
		// le classi minimize e maximize servono per la corretta visualizzazione nei pc
		friendsSection.classList.remove("maximize");
		friendsSection.classList.add("minimize");
		document.getElementById("hideFriendsListIcon").style.display = "none";
		document.getElementById("showFriendsListIcon").style.display = "block";
		var friendsListDiv = document.getElementById("friendsListDiv");
		friendsListDiv.style = "";
	}

	/* Quando l'utente decide di eliminare un utente e clicca sul bottone di rimozione
		 correlato viene mandata in esecuzione la seguente funzione */

	function deleteFriend(email, event) {
		event.preventDefault();
		serverServices.deleteFriend(email, function (response) {
			if (response.error) {
				alert("si è presentato un errore " + response.error);
				return;
			} else {
				// viene riaggiornata la lista degli amici
				openFriendsSection(event);
				return;
			}
		});
	}
}