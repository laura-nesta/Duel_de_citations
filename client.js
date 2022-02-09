/* ******************************************************************
 * Constantes de configuration
 */
const apiKey = "c3a8788d-ada4-4b4d-806b-98f34a238792";
const serverUrl = "https://lifap5.univ-lyon1.fr";

/* ******************************************************************
 * Gestion des tabs "Voter" et "Toutes les citations"
 ******************************************************************** */

/**
 * Affiche/masque les divs "div-duel" et "div-tout"
 * selon le tab indiqué dans l'état courant.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majTab(etatCourant) {
   console.log("CALL majTab");
   const dDuel = document.getElementById("div-duel");
   const dTout = document.getElementById("div-tout");
   const tDuel = document.getElementById("tab-duel");
   const tTout = document.getElementById("tab-tout");
   if (etatCourant.tab === "duel") {
      dDuel.style.display = "flex";
      tDuel.classList.add("is-active");
      dTout.style.display = "none";
      tTout.classList.remove("is-active");
      charge_duel_aleatoire();
   } else {
      dTout.style.display = "flex";
      tTout.classList.add("is-active");
      dDuel.style.display = "none";
      tDuel.classList.remove("is-active");
      charge_citations();
      document.getElementById("VerifFormAdd").onclick = function () {
         verif_Ajout(etatCourant) }
      document.getElementById("VerifFormModif").onclick = function () {
         verifModif() }
   }
}

/**
 * Mets au besoin à jour l'état courant lors d'un click sur un tab.
 * En cas de mise à jour, déclenche une mise à jour de la page.
 *
 * @param {String} tab le nom du tab qui a été cliqué
 * @param {Etat} etatCourant l'état courant
 */
function clickTab(tab, etatCourant) {
   console.log(`CALL clickTab(${tab},...)`);
   if (etatCourant.tab !== tab) {
      etatCourant.tab = tab;
      majPage(etatCourant);
   }
}

/**
 * Enregistre les fonctions à utiliser lorsque l'on clique
 * sur un des tabs.
 *
 * @param {Etat} etatCourant l'état courant
 */
function registerTabClick(etatCourant) {
   console.log("CALL registerTabClick");
   document.getElementById("tab-duel").onclick = () =>
      clickTab("duel", etatCourant);
   document.getElementById("tab-tout").onclick = () =>
      clickTab("tout", etatCourant);
}

/* ******************************************************************
 * Gestion de la boîte de dialogue (a.k.a. modal) d'affichage de
 * l'utilisateur.
 * ****************************************************************** */

/**
 * Fait une requête GET authentifiée sur /whoami
 * @returns une promesse du login utilisateur ou du message d'erreur
 */
function fetchWhoami() {
   return fetch(serverUrl + "/whoami", { headers: { "x-api-key": apiKey } })
   .then((response) => response.json())
   .then((jsonData) => {
      if (jsonData.status && Number(jsonData.status) != 200) {
         return { err: jsonData.message };
      }
      return jsonData;
   })
      .catch((erreur) => ({ err: erreur }));
}

/**
 * Fait une requête sur le serveur et insère le login dans
 * la modale d'affichage de l'utilisateur.
 *
 * @param {Etat} etatCourant l'état courant
 * @returns Une promesse de mise à jour
 */
function lanceWhoamiEtInsereLogin(etatCourant) {
   return fetchWhoami().then((data) => {
      etatCourant.login = data.login; // qui vaut undefined en cas d'erreur
      etatCourant.errLogin = data.err; // qui vaut undefined si tout va bien
      majPage(etatCourant);
      // Une promesse doit renvoyer une valeur, mais celle-ci n'est pas importante
      // ici car la valeur de cette promesse n'est pas utilisée. On renvoie
      // arbitrairement true
      return true;
   });
}

/**
 * Affiche ou masque la fenêtre modale de login en fonction de l'état courant.
 * Change la valeur du texte affiché en fonction de l'état
 *
 * @param {Etat} etatCourant l'état courant
 */
function majModalLogin(etatCourant) {
   const modalClasses = document.getElementById("mdl-login").classList;
   if (etatCourant.loginModal) {
      modalClasses.add("is-active");
      const elt = document.getElementById("elt-affichage-login");

      const ok = etatCourant.login !== undefined;
      if (!ok) {
         //elt.innerHTML = `<span class="is-error">${etatCourant.errLogin}</span>`;
         elt.innerHTML = `<label class="label">Entrer votre clé</label>
        <div class="control">
             <input name="cleApi" class="input key" type="password"
             placeholder="69617e9b-19db-4bf" id="apiKeyTexte" required>
        </div>`;
        document.getElementById("btn-login-apiKey").innerHTML =
            `<button class="button is-primary">Se connecter</button>`;
      } else {
         elt.innerHTML = `Bonjour ${etatCourant.login}.`;
      }
   } else {
      modalClasses.remove("is-active");
   }
}

/**
 * Déclenche l'affichage de la boîte de dialogue du nom de l'utilisateur.
 * @param {Etat} etatCourant
 */
function clickFermeModalLogin(etatCourant) {
   etatCourant.loginModal = false;
   majPage(etatCourant);
}

/**
 * Déclenche la fermeture de la boîte de dialogue du nom de l'utilisateur.
 * @param {Etat} etatCourant
 */
function clickOuvreModalLogin(etatCourant) {
  etatCourant.loginModal = true;
  lanceWhoamiEtInsereLogin(etatCourant);
  majPage(etatCourant);
}

/**
 * Enregistre les actions à effectuer lors d'un click sur les boutons
 * d'ouverture/fermeture de la boîte de dialogue affichant l'utilisateur.
 * @param {Etat} etatCourant
 */
function registerLoginModalClick(etatCourant) {
   document.getElementById("btn-close-login-modal1").onclick = () =>
      clickFermeModalLogin(etatCourant);
   document.getElementById("btn-close-login-modal2").onclick = () =>
      clickFermeModalLogin(etatCourant);
   document.getElementById("btn-open-login-modal").onclick = () =>
      clickOuvreModalLogin(etatCourant);
}

/* ******************************************************************
 * Initialisation de la page et fonction de mise à jour
 * globale de la page.
 * ****************************************************************** */

/**
 * Mets à jour la page (contenu et événements) en fonction d'un nouvel état.
 *
 * @param {Etat} etatCourant l'état courant
 */
function majPage(etatCourant) {
   console.log("CALL majPage");
   majTab(etatCourant);
   majModalLogin(etatCourant);
   registerTabClick(etatCourant);
   registerLoginModalClick(etatCourant);
}

/**
 * Appelé après le chargement de la page.
 * Met en place la mécanique de gestion des événements
 * en lançant la mise à jour de la page à partir d'un état initial.
 */
function initClientCitations() {
   console.log("CALL initClientCitations");
   const etatInitial = {
      tab: "duel",
      loginModal: false,
      login: undefined,
      errLogin: undefined,
  };
  majPage(etatInitial);
}

// Appel de la fonction init_client_duels au après chargement de la page
document.addEventListener("DOMContentLoaded", () => {
   console.log("Exécution du code après chargement de la page");
   initClientCitations();
});

/////////////////////////////////////////////////////////////
// -- Affichage de l'ensemble des citations du serveur -- //
////////////////////////////////////////////////////////////

/**
 * Ajoute une ligne au tableau des citations.
 *
 * @param {String} classement le classemnt de la citation
 * @param {String} personnage le personnage
 * @param {String} citation la citation
 * @param {String} id identifiant de la citation
 */
function ajoutLigneTab(classement, personnage, citation, id){
   document.getElementById("tabCitations").innerHTML += "<tr><th>" +
      classement + "</th><td>" +
      personnage + "</td>" + `<td onclick="detail('` + id + `')">` +
      citation + "</td>" + "<td>" + ouvreModif('` + id + `' ) + "</td>" + "</tr>";

}

/**
* ordonne les données dans le tableau des citations
*
* @param {tableau} arr le tableau
*/
function format_citations(arr) {
   arr.reduce((acc, x) => {
      console.log(x.quote);
      ajoutLigneTab(0, x.character, x.quote,x._id);
   });
}

/**
* Charge les citations du serveurs
*/
function charge_citations() {
   fetch(serverUrl + "/citations", { headers: { "x-api-key": apiKey } })
      .then(res => res.json())
      .then(data => obj = data)
      .then(() => { format_citations(obj) })
}

//////////////////////////////////////////
// -- Affichage d’un duel aléatoire -- //
/////////////////////////////////////////

/**
*renvoie un élément aléatoire
*
* @param {tableau} tab un tableau
*/
function aleatoire(tab) {
   return tab.splice(Math.floor(Math.random() * tab.length), 1)[0];
}

/**
* oriente l'image du bon côté pour que les personnages se fasse face
*
* @param {String} direction gauche ou droite selon où regarde le personnage
* @param {String} lienImage lien de l'image
* @param {int} n indice de la sitation
*/
function orientation_image(direction, lienImage, n) {
   document.getElementsByClassName("imageCitation")[n].src = lienImage;
   if (direction == "Left" && n == 0) {
      document.getElementsByClassName("imageCitation")[n].style.transform =
         "rotateY(0deg)";
   } else if (direction == "Right" && n == 1) {
      document.getElementsByClassName("imageCitation")[n].style.transform =
         "rotateY(0deg)";
   } else if (direction == "Left" && n == 1) {
      document.getElementsByClassName("imageCitation")[n].style.transform =
         "rotateY(-160deg)";
   } else {
      document.getElementsByClassName("imageCitation")[n].style.transform =
         "rotateY(-160deg)";
   }
}

/**
* oriente l'image du bon côté pour que les personnages se fasse face
*
* @param {objet} data citation
* @param {int} n indice de la sitation
*/
function affiche_citation(data, n) {
   document.getElementsByClassName("titre")[n].innerHTML = '"' + data.quote + '"';
   document.getElementsByClassName("personnage")[n].innerHTML =
      data.character + " dans " + data.origin;
   document.getElementsByClassName("idCitation")[n].innerHTML = data._id;
   orientation_image(data.characterDirection, data.image, n);
   orientation_image(data.characterDirection, data.image, n);
}

/**
* appel l'affichage d'une citations aléatoire
*
* @param {objet} data citation
*/
function duel_aletoire(data) {
   affiche_citation(aleatoire(data), 0);
   affiche_citation(aleatoire(data), 1);
}

/**
* charge les citations du serveurs et affiche un duel aléatoire
*/
function charge_duel_aleatoire() {
   fetch(serverUrl + "/citations", { headers: { "x-api-key": apiKey } })
      .then(res => res.json())
      .then(data => obj = data)
      .then(() => { duel_aletoire(obj) })
}

////////////////
// -- Vote -- //
////////////////

/**
* après avoir cliquer sur l'un des bouton de Vote
* met à jour les données
* puis affiche un nouveau duel
*
* @param {objet} data citation
*/
function vote(elem) {
   if (elem === "gauche") {
      id_winner = document.getElementsByClassName("idCitation")[0].innerHTML;
      id_looser = document.getElementsByClassName("idCitation")[1].innerHTML;
   } else {
      id_winner = document.getElementsByClassName("idCitation")[1].innerHTML;
      id_looser = document.getElementsByClassName("idCitation")[0].innerHTML;
   }
   fetch(serverUrl + "/citations/duels", {
      method: 'POST',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         'x-api-key': apiKey
      },
      body: JSON.stringify({ winner: id_winner, looser: id_looser })
   });
   console.log("winner:" + id_winner);
   console.log("looser:" + id_looser);
   charge_duel_aleatoire();
}

//////////////////////////////////
// -- Détails d’une citation -- //
//////////////////////////////////

/**
* Affiche le détail d'une citation dans une fenêtre modal
*
* @param {String} id indice de la citation
*/
function detail(id) {
      fetch(serverUrl + "/citations/" + id, {
      method: 'GET',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json'
      },
   })
   .then(res => res.json())
   .then(data => obj = data)
   .then(() => {
      console.log(obj._id)
      document.getElementById("mdl-details").style.display = "block";
      document.getElementById("quote").innerHTML =
         '<span><strong>Citation : </strong>"</span>' + obj.quote + '"';
      document.getElementById("character").innerHTML =
         '<span><strong>Personnage :</strong></span>' + obj.character;
      document.getElementById("image").innerHTML =
         "<span><strong>Url de l'image : </strong></span><a>" + obj.image + "</a>";
      document.getElementById("character-direction").innerHTML =
         "<span><strong>Direction du personnage : </strong></span>" +
         obj.characterDirection;
      document.getElementById("origin").innerHTML =
         "<span><strong>Origine : </strong></span>" + obj.origin;
      document.getElementById("proprietaire").innerHTML =
         "<span><strong>Ajouter par : </strong></span>" + obj.addedBy;
   })
}

/**
* ferme la fenêtre modal qui affiche les détails d'une citation
*/
function close_detail() {
   document.getElementById("mdl-details").style.display = "none";
}


/////////////////////////////
// -- Ajout de citation -- //
/////////////////////////////

/**
 *Ouvre une modal qui permet l'ajout d'une citation
 */
function OuvreModalAjout() {
   document.getElementById("mdl-ajoutCitation").style.display = "block";
}

/**
 * Ajoute une citation sur le serveur
 *
 *@param {Etat} etatCourant l'état courant
 */
function ajoutCitation(etatCourant) {
   fetch(serverUrl + "/citations", {
      method: 'POST',
      headers: {
         'Accept': 'application/json',
         'Content-Type': 'application/json',
         "x-api-key": apiKey,
      },
      body: JSON.stringify({
      quote: document.getElementById("Quote").value,
      character: document.getElementById("Perso").value,
      origin: document.getElementById("Origine").value,
      image: document.getElementById("lien").value,
      characterDirection: document.getElementById("Direction").value
      })
   })
}

/**
 * Vérifie la validité de tous les champs avant d'ajouter la citations
 * si il y a des champs maquants, une alerte apparaîtemp
 * si les champs sont valides, la fenêtre se ferme
 *
 *@param {Etat} etatCourant l'état courant
 */
function verif_Ajout(etatCourant) {
   if (document.getElementById("Quote").value == "") {
      alert("Champs citation obligatoire");
   } else if (document.getElementById("Perso").value == "") {
      alert("Champs personnage obligatoire")
   } else if (document.getElementById("Origine").value == "") {
      alert("Champs origine obligatoire")
   } else {
      ajoutCitation(etatCourant);
      charge_citations();
      FermeModalAjout();
   }
}

/**
 * Ferme la modal d'ajout d'une citation
 */
function FermeModalAjout() {
  document.getElementById("mdl-ajoutCitation").style.display = "none";
}

///////////////////////////////////////
// -- Modification d’une citation -- //
//////////////////////////////////////

/**
 * Affiche le boutton de modification
 * si le numero etudiant addedBy est identique que celui correspondant à
 * la clé api, le bouton sera cliquable.
 * Sinon le bouton sera desactiver
 *
 * @param {String} id l'identifiant de la citation.
 */
function ouvreModif(id) {
   if (true) { /*if (id.addedBy == etatCourant.login)*/
      return `<button class="button is-primary is-light" value='" + id + "'
         onclick="OuvreModalModif()">Modifier la citation </bouton>`;
   } else {
       return `<button class="button is-primary title="Disabled button">
         Modifier la citation </bouton>`;
    }
}

function OuvreModalModif() {
   document.getElementById("mdl-modifCitation").style.display = "block";
}

/**
 * Récupere les champs de la citation pour pouvoir la modifier
 *
 *@param {String} id identifiant de la citation.
 */
function recupereCitation(id) {
  fetch(serverUrl + "/citations/" + id, {
    method: 'GET',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
  })
    .then(res => res.json()).then(data => obj = data)
    .then(() => {
      document.getElementById("QuoteModif").value = obj.quote;
      document.getElementById("PersoModif").value = obj.character;
      document.getElementById("OrigineModif").value = obj.origin;
      document.getElementById("DirectionModif").value = obj.characterDirection;
      document.getElementById("lienModif").value = obj.url;
    })
}

/**
 * Modifie le formulaire de la citation
 *
 * @param {String} id  l'identifiant de la citation.
 */
function requete_modifier(id) {
    fetch(serverUrl + "/citations/" + id, {
        method: 'PUT',
        headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            "x-api-key": apiKey,  /*"x-api-key": etatCourant.api,*/
        },
        body: JSON.stringify({
            quote: document.getElementById("QuoteModif").value,
            character: document.getElementById("PersoModif").value,
            origin: document.getElementById("OrigineModif").value,
            image: document.getElementById("lienModif").value,
            characterDirection: document.getElementById("DirectionModif").value
        })
    })
}

/**
 * Vérifie le formulaire pour la modification
 *
 *@param {String} id l'identifiant de la citation.
 */
function verifModif(id) {
   if (document.getElementById("QuoteModif").value == "") {
      alert("Champs citation obligatoire");
   } else if (document.getElementById("PersoModif").value == "") {
      alert("Champs personnage obligatoire")
   } else if (document.getElementById("OrigineModif").value == "") {
      alert("Champs origine obligatoire")
   } else {
      alert("Modification effectuée")
      requete_modifier(id);
   }
}

/**
 * Affiche la boîte modal de modifiaction de la citation
 *
 *@param {String} id l'identifiant de la citation.
 */
function mdl_modifierCitation(id) {
  document.getElementById("mdl-modifCitation").style.display = "block";
  recupereCitation(id);
  document.getElementById("VerifFormModif").onclick = function () {
     verifModif(id);
  }
}

/**
 * Ferme la boîte modal de modification de citation
 */
function FermeModalModif() {
  document.getElementById("mdl-modifCitation").style.display = "none";
}

/////////////////////
// -- Connexion -- //
/////////////////////

/* modifiction de la fonction majModalLogin(etatCourant) ligne 115 */
