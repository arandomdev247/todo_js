/**
 * Copyright (c) 2022
 *
 * This program connects with a server to generate
 * a todo list from it and modify it on the go.
 * Created for educationnal purpose.
 * 
 *
 * @summary Shows a TODO LIST from a server
 * @author Benjamin <benjamin.adamczyk@outlook.fr>
 *
 * Created at     : 2022-03-15 18:21:14 
 * Last modified  : 2022-03-27 03:16:40
 */

//url principale vers le serveur
const url = "http://localhost:9090/api/taches";

//Array gardant toutes les data sync avec le serv
var arrayLeft = [];
var arrayRight = [];


//Backup pour la fonction annuler
var lastArrayLeft = arrayLeft.slice(0);
var lastArrayRight = arrayRight.slice(0);

var test_i = 0; //Uniquement utilisé pour le dev

//Messages d'erreurs et de confirmation
const arrayStatus = ["Ajout réussi", 
"Veuillez écrire un texte avant de valider",
"Ajout échoué : Erreur avec le serveur",
"Modification réssie",
"Modification annulée",
"Modification échouée : Erreur avec le serveur",
"Suppression réussie",
"Suppression échouée : Au moins une erreur avec le serveur détectée.",
"Fin de tâche réussie.",
"Fin de tâche échoué : Au moins une erreur avec le serveur détectée.",
"Connexion au serveur établie.",
"Impossible de se connecter au serveur !",
"Annulation réussie",
"Erreur critique pendant l'annulation ! \
Certaines données sont probablement perdues. Veuillez rafraichir la page."]


//Premier chargement du document avec la page
async function loadDoc(load = 0)
{


    const url = "http://localhost:9090/api/taches";
    let myObject = await getData(url);
    
    if (load === 0)
        {
        if (myObject === -1){
            setStatus(11);
            return 0;
        }
        else {
            setStatus(10);
        }
    }
    //myObject === -1 ? setStatus(11) : setStatus(10);

    let myData = await myObject.text();
    myText = JSON.parse(myData);

    let arrayTotal = JsonToArray(myText);
    loadTable(arrayTotal, "tableleft");
    loadTable(arrayTotal, "tableright");

    if (load != 0) return load;
}

//Annule la dernière action de l'utilisateur
async function undoLastAction(){


    if (lastArrayLeft.length === 0 || lastArrayRight.length === 0)
    {
        alert("Impossible de lancer l'annulation pour le moment.")
        return 1;
    }

    let errCheck = 0;
    let isConfirmed = confirm("/!\\ Attention ! /!\\\r\n\r\n" +
        "Dû à une limitation technique, l'annulation réinitialisera TOUTES les dates " +
        "(ainsi que leurs ID) pour mettre la date actuelle sur toutes les entrées.\r\n\r\n" +
        "Êtes vous sûr de vouloir continuer ?\r\n\r\n" +
        "Fonctionnalité expérimentale. Evitez de le faire après une suppression.");

    if (!isConfirmed) return 0;

    document.getElementById("undo_button").disabled = true;
    arrayLeft.length = 0;
    arrayRight.length = 0;

    checkAll("tableleft", true);
    checkAll("tableright", true);

    errCheck += await deleteEntry("tableleft", true);
    errCheck += await deleteEntry("tableright", true);

    errCheck += await generateEntry("tableleft");
    errCheck += await generateEntry("tableright");

    for(i = 0; i < arrayRight.length; i++)
    {
        finishTask(arrayRight[i][0], arrayRight[i][1])
    }

    cleanTable("tableleft");
    cleanTable("tableright");

    await new Promise(r => setTimeout(r, 300));
    loadDoc(1);

    errCheck != 4 ? setStatus(13) : setStatus(12);
}

//Génère les entrées à partir d'une table déjà existante
async function generateEntry(idTable)
{
    arrayTable = idTable === "tableleft" ? lastArrayLeft : lastArrayRight;
    for (let i = 0; i < arrayTable.length; i++)
    {
        let id = await addTask(arrayTable[i][1]);
        let date = getDate();

        idTable === "tableleft" ?
        addTable(id, arrayTable[i][1], date, idTable, true) :
        addTable(id, arrayTable[i][1], date, idTable, true, true);

        if (id === -1)
        {
            alert("Erreur critique durant l'annulation !");
            return 0;
        }
    }
    return 1;
}

//Function d'action pour le bouton Insérer
async function createEntry()
{
    let text = document.getElementById('new_input_text').value;

    if (text === "" || text === null || text === undefined)
    { 
        setStatus(1);
        return 0;
    }

    lastArrayLeft = arrayLeft.slice(0);
    lastArrayRight = arrayRight.slice(0);
    document.getElementById("undo_button").disabled = false;

    let id = await addTask(text);
    let date = getDate();
    
    if (id === -1)
    {
        if (loadDoc(1) === 0) return 0; 
    }
    else
    {
        addTable(id, text, date, "tableleft");
        document.getElementById('new_input_text').value = "";
        setStatus(0);
    }
}

//Ajoute une tache au serveur
async function addTask(newEntry)
{
        /* NOTE IMPORTANTE !
    Après de nombreuses tentatives avec AJAX, je n'ai pas réussi
    à récupérer une réponse concise du serveur en dehors de ma propre
    requête. J'ai besoin de récupérer l'id à attribuer à la checkbox de la note

    J'ai donc dû utiliser fetch pour la méthode POST afin de récupérer
    la nouvelle note nouvellement crée, et de ce fait, l'id correspondant.
    */

    /*console.debug("newEntry = ", newEntry);
    let data = {};

    data.description = newEntry;

    let xhr = new XMLHttpRequest();
    xhr.open("POST", url);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.responseType = 'text';
    console.log("loading");

    //xhr.onreadystatechange = handleRequestStateChange;
    console.log("endload");
    xhr.send(JSON.stringify(data));

    xhr.addEventListener("readystatechange", function() {
        if(this.readyState === 4) {
            console.log(this.responseText);
        }
            
        let data= xhr.responseText;
        //var jsonResponse = JSON.parse(data);
            
        console.log(jsonResponse);
        });
    
    console.log('json : "', data, '"');

    
        
    console.log(xhr.response);

    console.log(xhr.status);
    console.log("text", xhr.responseText);

    let myJson = JSON.parse(data);
    return myJson.id;
    */

    let data = {};

    data.description = newEntry;

    let retDataId = await fetch(url, {
        method: "POST",
        headers:{
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success adding : ', data);
            return JSON.parse(data.id);})
        .catch((error) => {
            console.error('Error adding : ', error);
            return -1;
        });
    return(retDataId);
}

//Fonction d'action le bouton Supprimer
async function deleteEntry(idTable, undo=false)
{
    let errCheck = 0;
    let row = -1;
    let index = -1;
    let nameCheckBoxes = idTable === "tableleft" ? "left" : "right";
    checkedBoxes = document.querySelectorAll('input[name=todoboxes'+nameCheckBoxes+']:checked');
    markedCheckBox = document.getElementsByName('todoboxes'+nameCheckBoxes);
    let table = document.getElementById(idTable);

    if (undo === false){
    lastArrayLeft = arrayLeft;
    lastArrayRight = arrayRight;
    }
    document.getElementById("undo_button").disabled = false;

    for (let i = 0; i < checkedBoxes.length; i++)
    {
        for (let checkbox of markedCheckBox)
        {
            if(checkbox.checked)
            {
                row = checkbox.closest('tr').rowIndex;
                table.deleteRow(row);
                index = findIndex(checkbox.id, arrayLeft);
                removeTable(index, idTable);
                errCheck += await deleteTask(checkbox.id) === 0 ? 1 : 0;
            }
        }
    }
    errCheck === 0 ? setStatus(6) : setStatus(7);
    return errCheck === 0 ? 1 : 0;
}

//Supprime une tache au serveur
async function deleteTask(id)
{

    const delUrl = url + "/" + id;
    const data = {"id" : id};

    return fetch(delUrl, {
        method: "DELETE",
        headers:{'Content-Type': 'application/json'},
        body: JSON.stringify(data),
        })
        .then(data => {
            console.log('Success deleting : ', data);
            return 1;})
        .catch((error) => {
            console.error('Error deleting : ', error);
            return 0;
        })
}

//Fonction d'action pour le bouton Terminer
async function finishEntry(isUndo = false)
{
    let errCheck = 0;
    let index = -1;
    let markedCheckBoxLeft = document.getElementsByName("todoboxesleft")

    if (isUndo === false)
    {
        lastArrayLeft = arrayLeft.slice(0);
        lastArrayRight = arrayRight.slice(0);
    }
    document.getElementById("undo_button").disabled = false;

    for (let checkbox of markedCheckBoxLeft)
    {
        if(checkbox.checked)
        {
            index = findIndex(checkbox.id, arrayLeft);
            errCheck += finishTask(arrayLeft[index][0], arrayLeft[index][1], arrayLeft[index][2]) === 0 ?
            1 : 0;
            removeTable(index, "tableleft");
        }
    }
    errCheck === 0 ? setStatus(8) : setStatus(9);

    cleanTable("tableleft");
    cleanTable("tableright");

    await new Promise(r => setTimeout(r, 300));
    loadDoc();
}

//Attribue la tache comme terminée au serveur
function finishTask(id, description)
{
    const termUrl = url + "/" + id + "/terminer";
    let xhr = new XMLHttpRequest();
    let data = {};
    let retStatus = 0;

    data.id = id;
    data.description = description;
    
    xhr.open("PUT", termUrl);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            console.log(xhr.status);
            console.log(xhr.responseText)
            retStatus = 1;
        }
        else
        {
            retStatus = 0;
        }};
    
    xhr.send(JSON.stringify(data));
    return retStatus;
}

//Fonction d'action pour le bouton modifier
async function modifyEntry(idTable, isUndo = false)
{
    let errCheck = 0;
    let nameCheckBoxes = idTable === "tableleft" ? "left" : "right";
    let row = -1;
    let index = -1;

    if (isUndo === false)
    {
    lastArrayLeft = arrayLeft.slice(0);
    lastArrayRight = arrayRight.slice(0);
    }
    document.getElementById("undo_button").disabled = false;

    checkedBoxes = document.querySelectorAll('input[name=todoboxes'+nameCheckBoxes+']:checked');
    markedCheckBox = document.getElementsByName('todoboxes'+nameCheckBoxes);

    let table = document.getElementById(idTable);

    for (let i = 0; i < checkedBoxes.length; i++)
    {
        for (let checkbox of markedCheckBox)
        {
            if (checkbox.checked)
            {
                row = checkbox.closest('tr').rowIndex;
                index = findIndex(checkbox.id, idTable === "tableleft" ? arrayLeft : arrayRight);
                do {

                    text = prompt("Entrez le texte à modifier :",  idTable === "tableleft" ? arrayLeft[index][1] : arrayRight[index][1]);
                    if (text === ""){
                        alert("Veuillez ne pas laisser l'emplacement vide");
                    }
                } while (text === "");
                if (text != null)
                {
                    modifyTable(index, text, idTable);
                    table.deleteRow(row);

                    idTable === 'tableleft' ?
                    generateRow(arrayLeft[index][0], arrayLeft[index][1], arrayLeft[index][2], idTable, row) :
                    generateRow(arrayRight[index][0], arrayRight[index][1], arrayRight[index][2], idTable, row);

                    errCheck += await modifyTask(arrayLeft[index][0], arrayLeft[index][1]) === 0 ? 1 : 0;
                }
            }
        }
    }
    text != null ? errCheck === 0 ? setStatus(3) : setStatus(5) : setStatus(4);
}

//Envois la modification au serveur
async function modifyTask(id, description)
{
    let retStatus;
    const modUrl = url + "/" + id;
    let xhr = new XMLHttpRequest();
    let data = {};

    data.id = id;
    data.description = description;

    xhr.open("PUT", modUrl);

    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onreadystatechange = function() {
        if (xhr.readyState == 4) {
            console.log(xhr.status);
            console.log(xhr.responseText)
            retStatus = 1;
        }
        else
        {
            retStatus = 0;
        }};
    
    xhr.send(JSON.stringify(data));
    return retStatus;    

}

//Récupération la todo-list depuis le serveur et catch les erreurs de connexion
async function getData(url)
{
    try
    {
        return await fetch(url);
    }
    catch(e)
    {
        console.error(e);
        return -1;
    }
}

//FindIndex customisé pour les array 2D en JS
function findIndex(valueToSearch, theArray, currentIndex) {
    if (currentIndex == undefined) currentIndex = '';
        if(Array.isArray(theArray)) {
            for (var i = 0; i < theArray.length; i++) {
                if(Array.isArray(theArray[i])) {
                    newIndex = findIndex(valueToSearch, theArray[i], currentIndex + i + ',');
                    if (newIndex >= 0) {
                        return newIndex;
                    }
               } else if (theArray[i] == valueToSearch) {
                   return parseInt(currentIndex) + i;
               }
            }
    } else if (theArray == valueToSearch) {
        return pasrseInt(currentIndex) + i;
    }
    return -1;
}

//Charge les tables de gauche et de droite selon idTable
function loadTable(data, idTable)
{
    idTable === "tableleft" ? arrayLeft = [] : arrayRight = [];
    arrayLoader = 0

    for (let i = 0; i < data.length; i++)
    {
        if (!data[i][3] && idTable == "tableleft")
        {
            generateRow(data[i][0], data[i][1], data[i][2], idTable);
            arrayLeft[arrayLoader] = data[i];
            arrayLoader ++;
        }
        if (data[i][3] && idTable == "tableright")
        {
            generateRow(data[i][0], data[i][1], data[i][2], idTable);
            arrayRight[arrayLoader] = data[i];
            arrayLoader ++;
        }
    }
}

//Supprime toute la table HTML séléctionnée
function cleanTable(idTable)
{
    let myTBody = idTable === "tableleft" ? "tbodyleft" : "tbodyright";
    let myNode = document.getElementById(myTBody);
    if (myNode.children.length > 0){
        while (myNode.hasChildNodes()) {
            myNode.removeChild(myNode.lastChild);
        }
    }
    idTable === "tableleft" ? arrayLeft = [] : arrayRight = [];
}

//Ajoute une entrée à l'array
function addTable(id, text, date, idTable, terminee = false, undo = false)
{
    idTable === "tableleft" ?
    arrayLeft.push([id, text, date, terminee]) :
    arrayRight.push([id, text, date, terminee]);
    if (undo === false) generateRow(id, text, date, idTable);
}

//Supprime une entrée de l'array avec l'index
function removeTable(index, idTable)
{
    let tmp_Array1, tmp_Array2;

    if (idTable == "tableleft" && index > -1)
    {
        tmp_Array1 = arrayLeft.slice(0, index);
        tmp_Array2 = arrayLeft.slice(index + 1, arrayLeft.length);
        arrayLeft = tmp_Array1.concat(tmp_Array2);
    }
    if (idTable == "tableright" && index > -1)
    {
        tmp_Array1 = arrayRight.slice(0, index);
        tmp_Array2 = arrayRight.slice(index + 1, arrayRight.length);
        arrayRight = tmp_Array1.concat(tmp_Array2);
    }
}

//Modifie la description d'une ligne de l'array
function modifyTable(index, text, idTable)
{
    if (idTable == "tableleft" && index > -1)
    {
        arrayLeft[index][1] = text;
    }
    if (idTable == "tableright" && index > -1)
    {
        arrayRight[index][1] = text;
    }
}

//Déplace une ligne sur l'autre array
function moveTable(index, idTableOrigin, idTableFinal)
{
    index == false ? 0 : index;

    let tmpArray = idTableOrigin == "tableleft" ? arrayLeft[index] : arrayRight[index];
    
    addTable(tmpArray[0], tmpArray[1], tmpArray[2], idTableFinal);
    removeTable(index, idTableOrigin);
}

//Génère une ligne de l'array | Modify = -1
function generateRow(id, text, date, idTable, modify = 0)
{
    text = typeof(text) == "string" ? document.createTextNode(text) : text;
    date = typeof(date) == "string" ? document.createTextNode(date) : date;

    let tableleft = document.getElementById(idTable);
    let row = tableleft.insertRow(modify);
    let cellCheckbox = row.insertCell(0);
    let cellDate = row.insertCell(1);
    let cellDesc = row.insertCell(2);

    let tmp_selec = idTable == "tableleft" ? 1 : 2;

    cellCheckbox.appendChild(createCheckbox(id, tmp_selec));
    //cellCheckbox.appendChild(document.createTextNode(id));
    cellDate.appendChild(date);
    cellDesc.appendChild(text);
}

//Genère une checkbox dynamiquement. Side = 1 => tableau gauche sinon, tableau droite
function createCheckbox(id, side)
{
    let newCheckbox = document.createElement("input");

    newCheckbox.type = "checkbox";
    newCheckbox.id = id;
    newCheckbox.name = side == 1 ? "todoboxesleft" : "todoboxesright"

    return newCheckbox;
}

//Generate array from JSON file
// 0 = ID
// 1 = Description
// 2 = Date
// 3 = Terminee
function JsonToArray(data)
{
    const rows = data.length;
    const cols = 4;
    let result = new Array(rows).fill(-1).map(_ => new Array(cols).fill(-1));

    for(let i = 0; i < data.length; i++)
    {
        result[i][0] = data[i].id;
        result[i][1] = data[i].description;
        result[i][2] = data[i].date;
        result[i][3] = data[i].terminee;
    }
    return result
}

//Renvois la date actuelle
function getDate()
{
    let date = new Date();
    const year = date.getFullYear();
    const month = ("0" + (date.getMonth() + 1)).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);

    return document.createTextNode(year + '-' + month + '-' + day);
}

//Affiche le status des modifications de la TODO list
function setStatus(numStatus)
{
    if (numStatus < 0 || numStatus >= arrayStatus.length) {
        document.getElementById("status").innerHTML =
        "Erreur : Numéro d'erreur inconnu."
        return 0;
    }
    document.getElementById("status").innerHTML = arrayStatus[numStatus];
    return 1;
}

//Check toutes les checkboxes de la table en paramètre
function checkAll(idTable, isChecked)
{
    let side = idTable === "tableleft" ? "left" : "right";

    let markedCheckBox = document.getElementsByName("todoboxes" + side);
    for (let checkbox of markedCheckBox)
    {
        checkbox.checked = isChecked;
    }
}

//*DEV FONCTIONNALITE* Génère 10 entrée dans la todolist
async function myTest()
{
    for (let i = 1; i <11; i++)
    {
    addTask("Dat is a text " + (i + test_i) );
    }
    await new Promise(r => setTimeout(r, 200));
    test_i += 100;

    cleanTable("tableleft");
    cleanTable("tableright");
    loadDoc();
}