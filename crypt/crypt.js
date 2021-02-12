var room = 'public';
var password = 'open';
var tempRoom;
var tempPassword;

var username = getCookie('name');

setCookie('name', '');
setCookie('password', '');

document.getElementById('msgbox').placeholder = `Welcome, ${username}.`;

window.addEventListener('keydown', function(event){
    if(event.keyCode == 13){//enter key is pressed
        send();
    }
    else if(event.keyCode == 192){//tilde key is pressed
        window.location = 'https://www.monticello.org/thomas-jefferson/louisiana-lewis-clark/the-louisiana-purchase/';
    }
});

var refresh = setInterval(getMessages, 1000);

getMessages();

function getCookie(cname){
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}

function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

function changeName(){//change name
    var tempUsername = prompt('NAME?\nPut nothing to stay anonymous.');
    if(tempUsername != null){
        if(tempUsername == ''){
            tempUsername = 'ANONYMOUS';
        }
        username = tempUsername;
    }
    document.getElementById('msgbox').placeholder = `Welcome, ${username}.`;
}

function createStatus(response, roomName, roomPassword){//check created room status
    if(response == 'Created room.'){
        room = roomName;
        password = roomPassword;
        alert(response);
    }
    else{
        alert(response);
    }
}
function create(){//create a room
    var roomName = prompt('Room name:');
    var roomMasterPassword = prompt('This can be used to change room settings\nOwner password:');
    var roomPassword = prompt('Room password:');
    var roomWelcomeMessage = prompt('This will be shown when users join your room.\n{name} will be replaced with the users name\nWelcome message:');
    if(roomName != null || roomMasterPassword != null || roomPassword != null || roomWelcomeMessage != null){
        if(roomName == undefined || roomName == ''){//checking for legit name
            alert('Please give a name.');
        }
        else if(roomMasterPassword == undefined || roomMasterPassword == ''){//checking for legit owner password
            alert('Please give an owner password.');
        }
        else if(roomPassword == undefined || roomPassword == ''){//checking for legit password
            alert('Please give a password');
        }
        else if(roomWelcomeMessage == undefined || roomWelcomeMessage == ''){//checking for legit welcome message
            roomWelcomeMessage = `Welcome to ${roomName}, {NAME}`;
        }
        else{//name, owner password, and password were given
            fetch(`https://infinite-fjord-28854.herokuapp.com/create?name=${roomName}&password=${roomPassword}&masterPassword=${roomMasterPassword}&welcomeMessage=${roomWelcomeMessage}`, {
                method: 'POST'
            })
            .then(response => response.text())
            .then(response => createStatus(response, roomName, roomPassword));
        }
    }
}

function wipeMessages(){
    var masterPassword = prompt('Master password:');
    if(masterPassword != null){
        fetch(`https://infinite-fjord-28854.herokuapp.com/deleteMessages?room=${room}&password=${password}&masterPassword=${masterPassword}`, {
            method: 'POST'
        })
        .then(response => response.text())
        .then(response => alert(response));
    }
}

function checkJoinStatus(response, ){//check the response when joining a room
    if(response != 'Access granted.'){//access denied
        alert(response);
    }
    else{//access granted
        if(tempRoom == 'public'){
            document.getElementById('room').innerHTML = tempRoom.toUpperCase();
        }
        else{
            document.getElementById('room').innerHTML = tempRoom;
        }
        alert(response);
        room = tempRoom;
        password = tempPassword;
    }
}
function join(){//send the request to join a room
    tempRoom = prompt('Room name:');
    if(tempRoom == 'public'){//if user is trying to enter public room then auto fill password
        tempPassword = 'open';
    }
    else{//user is not trying to join public room so ask for password
        tempPassword = prompt('Room password:');
    }
    fetch(`https://infinite-fjord-28854.herokuapp.com/join?room=${tempRoom}&password=${tempPassword}`, {
        method: 'GET'
    })
    .then(response => response.text())
    .then(response => checkJoinStatus(response));
}

function checkMessageStatus(response){//alert the user if there was a problem with there message
    if(response != 'Message sent.'){//response was not 'Message sent.'
        alert(response);
    }
}
function send(){//send a message
    var message = document.getElementById('msgbox').value;
    document.getElementById('msgbox').value = '';
    if(room == null){//checking if user in in a room
        alert('You must join a room before sending messages!');
    }
    else if(password == null){//checking if password is set
        alert('No password set.');
    }
    else{
        if(message == null || message == ''){//checking for empty message
            alert('You cannot send an empty message!');
        }
        else{//if everything checks out
            fetch(`https://infinite-fjord-28854.herokuapp.com/send?room=${room}&password=${password}&message=${username}: ${message}`, {
                method: 'POST'
            })
            .then(response => response.text())
            .then(response => checkMessageStatus(response));
        }
    }
}

function leave(){//leave room
    if(room == undefined || password == undefined){
        alert('You must join a room before leaving.');
    }
    else{
        document.querySelectorAll('.message').forEach(e => e.remove());
        document.getElementById('room').innerHTML = 'PUBLIC';
        alert(`Left ${room}.`);
        room = 'public';
        password = 'open';
    }
}

function checkGetMessagesStatus(response){
    if(response.startsWith('#')){//messages were received
        document.querySelectorAll('.message').forEach(e => e.remove());
        var messages = response.substring(1, response.length).split(';');
        for(i = 0; i < messages.length; i++){
            messages[i] = messages[i].replace(/{NAME}/gi, username);
            var a = document.createElement('p');
            a.className = 'message';
            a.innerHTML = messages[i];
            document.getElementById('chat').appendChild(a);
            document.getElementById('chat').scrollTop = document.getElementById('chat').scrollHeight;
        }
    }
    else{//messages were not received
        alert(response);
    }
}
function getMessages(){
    if(room != undefined || password != undefined){
        fetch(`https://infinite-fjord-28854.herokuapp.com/messages?room=${room}&password=${password}`, {
            method: 'GET'
        })
        .then(response => response.text())
        .then(response => checkGetMessagesStatus(response));
    }
}

function changeRoomNameStatus(response, newName){
    if(response == 'Changed name.'){
        room = newName;
        document.getElementById('room').innerHTML = room;
    }
    else{
        alert(response);
    }
    var refresh = setInterval(getMessages, 1000);
}
function changeRoomName(){//Change the name of the current room
    var newName = prompt(`WARING: This will lock all users out\nWhat would you like to rename ${room} to?`);
    var masterPassword = prompt('Master password:');

    if(newName != null || masterPassword != null){
        clearInterval(refresh);
        fetch(`https://infinite-fjord-28854.herokuapp.com/rename?name=${room}&newName=${newName}&password=${password}&masterPassword=${masterPassword}`, {
            method: 'POST'
        })
        .then(response => response.text())
        .then(response => changeRoomNameStatus(response, newName));
    }
}