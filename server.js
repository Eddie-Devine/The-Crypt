const fs = require('fs');
const express = require('express');
const http = require('http');
const crypto = require('crypto');
const https = require('https');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const chalk = require('chalk');
const { checkServerIdentity } = require('tls');

const app = express();
const port = process.env.PORT || 5000;
//app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser())
const httpsOptions = {
    cert: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert')),
    key: fs.readFileSync(path.join(__dirname, 'ssl', 'server.cert'))
}

var rooms;
var hashes;

fs.readFile('rooms.json', function(err, data){
    if(err){
        console.log(chalk.red('Failed to read rooms.json'));
        throw err;
    }
    rooms = JSON.parse(data);
});

fs.readFile('hashes.json', function(err, data){
    if(err){
        console.log(chalk.red('Failed to read passwords.json'));
        throw err;
    }
    hashes = JSON.parse(data);
});

function backup(){//backup rooms.json
    var roomsBackup = rooms;
    for(i = 0; i < roomsBackup['names'].length; i++){//remove all messages from backup copy
        var name = roomsBackup['names'][i];
        roomsBackup[name]['messages'] = [];
    }
    fs.writeFile('rooms.json', JSON.stringify(roomsBackup), function(err){
        if(err){//checking for error
            console.log('Failed to backup rooms');
            throw err;
        }
        var date = new Date();
        console.log(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} : Backed up rooms.`);
    });
}

function wipeMessages(time){
    var names = rooms['names'];
    for(var i = 0; i < names.length; i++){
        var room = names[i];
        rooms[room]['messages'] = [];
    }
    console.log(chalk.blue(`${time} : Messages have been wiped!`));
}

function getTime(){
    var date = new Date();
    return `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}

function hash(str, method){
    return crypto.createHash(method).update(str).digest('hex');
}

//backup rooms.json every hour
var backupInterval = setInterval(backup, 3600000);

//delete messages at midnight (checks time every 30 minute)
var janitorCheck = setInterval(function(){
    var date = new Date();
    if(date.getHours() == 24){
        wipeMessages(date.getHours());
    }
}, 3600000);

// https.createServer(httpsOptions, app)
//     .listen(port, function(){
//         console.log(`Listening on port ${port}.`)
//     });

app.listen(port, ()=>{console.log(`Listening on port ${port}`);});

app.get('/', (req, res, next)=>{//Access point (front) GET
    res.sendFile(__dirname + '/front.html');
});

//about page
app.get('/about', (req, res, next)=>{
    res.sendFile(__dirname + '/about/about.html');
});
app.get('/about.css', (req, res, next)=>{
    res.sendFile(__dirname + '/about/about.css');
});
app.get('/about.js', (req, res, next)=>{
    res.sendFile(__dirname + '/about/about.js');
});
app.get('/back.png', (req, res, next)=>{
    res.sendFile(__dirname + '/about/back.png');
});

//login page
app.get('/login', (req, res, next)=>{
    res.sendFile(__dirname + '/login/login.html');
});
app.get('/login.css', (req, res, next)=>{
    res.sendFile(__dirname + '/login/login.css');
});
app.get('/login.js', (req, res, next)=>{
    res.sendFile(__dirname + '/login/login.js');
});

//login
app.post('/login', (req, res, next)=>{//send name and password, get cookies POST
    var name = req.query.name;
    var password = hash(req.query.password, 'sha256');

    if(password == hashes['entry']){//hash of under999 (SHA256)
        if(name == '' || name == undefined){//No name provided
            res.cookie('name', 'ANONYMOUS');
        }
        else{
            res.cookie('name', name);
        }
        res.cookie('password', password);
        res.send('Correct password.');
    }
    else{
        res.cookie('name', '');
        res.cookie('password', '');
        res.send('Incorrect password.');
    }
});

//the crypt
app.get('/crypt', (req, res, next)=>{//The Crypt GET
    var cookies = req.cookies;

    if(cookies.password != hashes['entry']){
        res.sendFile(__dirname + '/login/login.html');
        if(cookies.name != '' && cookies.password != ''){//don't log blank credentials (refreshes)
            console.log(chalk.red('Blocked login: ') + cookies.name + ' : ' + cookies.password);
        }
    }
    else{
        console.log(chalk.green('User accepted: ') + cookies.name + ' : ' + cookies.password);
        res.sendFile(__dirname + '/crypt/crypt.html');
    }
});
app.get('/crypt.css', (req, res, next)=>{//style GET
    res.sendFile(__dirname + '/crypt/crypt.css');
});
app.get('/crypt.js', (req, res, next)=>{//js GET
    res.sendFile(__dirname + '/crypt/crypt.js');
});
app.get('/send.png', (req, res, next)=>{//end icon GET
    res.sendFile(__dirname + '/crypt/send.png');
});
app.get('/about.png', (req, res, next)=>{
    res.sendFile(__dirname + '/crypt/about.png');
});
app.get('/change-name.png', (req, res, next)=>{//change name icon GET
    res.sendFile(__dirname + '/crypt/change-name.png');
});
app.get('/change-room-name.png', (req, res, next)=>{//change room name icon GET
    res.sendFile(__dirname + '/crypt/change-room-name.png');
});
app.get('/join.png', (req, res, next)=>{//join icon GET
    res.sendFile(__dirname + '/crypt/join.png');
});
app.get('/create.png', (req, res, next)=>{//create icon GET
    res.sendFile(__dirname + '/crypt/create.png');
});
app.get('/leave.png', (req, res, next)=>{//leave icon GET
    res.sendFile(__dirname + '/crypt/leave.png');
});
app.get('/delete-messages.png', (req, res, next)=>{//leave icon GET
    res.sendFile(__dirname + '/crypt/delete-messages.png');
});

//hash
app.get('/hash', (req, res, next)=>{//hash password with SHA256 GET
    console.log(req.query);
    if(req.query.hash == undefined){
        res.send('Nothing to hash.');
    }
    else{
        res.send(crypto.createHash('sha256').update(req.query.hash).digest('hex'));
    }
});

//front end commands
app.post('/deleteMessages', (req, res, next)=>{
    var room = req.query.room;
    var password = req.query.password;
    var masterPassword = req.query.masterPassword;

    if(room == '' || room == undefined){//checking if room is provided
        res.send('Please provide a room name.');
    }
    else if(password == '' || password == undefined){//checking if room password is provided
        res.send('Please provide the room password.');
    }
    else if(masterPassword == '' || masterPassword == undefined){//checking if master password is provided
        res.send('Please provide the room master password.');
    }
    else if(rooms[room]['password'] != password){//password is incorrect
        res.send('Incorrect password.');
    }
    else if(rooms[room]['masterPassword'] != masterPassword){//master password is incorrect
        res.send('Incorrect master password.');
    }
    else{//wipe messages
        rooms[room]['messages'] = [];
        rooms[room]['messages'].push(rooms[room]['welcomeMessage']);
        res.send(`Permanently wiped all messages in ${room}.`);
        console.log(rooms[room]['messages']);
    }
});

app.post('/rename', (req, res, next)=>{
    var name = req.query.name;
    var newName = req.query.newName;
    var password = req.query.password;
    var masterPassword = req.query.masterPassword;

    if(name == undefined || name == ''){//checking if name is provided
        res.send('Please provide a room name.');
    }
    else if(newName == undefined || newName == ''){//checking if new name is provided
        res.send('Please provide the new room name.')
    }
    else if(password == undefined || password == ''){//checking if password is provided
        res.send('Please provide the password.');
    }
    else if(masterPassword == undefined || masterPassword === ''){//checking if owner password is provided
        res.send('Please provide the owner password.');
    }
    else{//all variables are provided
        if(rooms[name] == undefined){//checking if room exists
            res.send('Room does not exist.');
        }
        if(rooms[name]['password'] != password){//checking if password is correct
            res.send('Incorrect password.');
        }
        else if(rooms[name]['masterPassword'] != masterPassword){//checking if owner password is correct
            res.send('Incorrect owner password.');
        }
        else{
            rooms['names'] = rooms['names'].filter(e => e !== name);
            var obj = {};
            obj['masterPassword'] = masterPassword;
            obj['password'] = password;
            obj['welcomeMessage'] = rooms[name]['welcomeMessage'];
            obj['messages'] = [];
            rooms[newName] = obj;
            delete rooms[name];
            rooms['names'].push(newName);
            backup();
            res.send('Changed name.');
        }
    }
});

app.post('/create', (req, res, next)=>{//create new room POST
    var name = req.query.name;
    var password = req.query.password;
    var masterPassword = req.query.masterPassword;
    var welcomeMessage = req.query.welcomeMessage;

    if(name == undefined || name == ''){//checking for legit name
        res.send('No name provided.');
    }
    else if(password == undefined || password == ''){//checking for legit password
        res.send('No password provided.');
    }
    else if(masterPassword == undefined || masterPassword == ''){//checking for legit master password
        res.send('No master password provided.');
    }
    else if(welcomeMessage == undefined || welcomeMessage == ''){//checking for legit master password
        welcomeMessage = `Welcome to ${name}.`;
    }
    else{//password and name are included in request
        if(rooms[name] == undefined){//room does not already exist, create room
            var obj = {};
            obj['masterPassword'] = masterPassword;
            obj['password'] = password;
            obj['welcomeMessage'] = welcomeMessage;
            obj['messages'] = [];
            rooms[name] = obj;
            rooms['names'].push(name);
            backup();
            res.send('Created room.');
            var date = new Date();
            console.log(`${date.getHours()}:${date.getMinutes()}:${date.getSeconds()} : Created new room.`);
            console.log(obj);
        }
        else{//room name is in use
            res.send('Room name is taken.');
        }
    }
});

app.get('/ping', (req, res, nest)=>{//ping GET
    res.send('pong');
});

app.get('/join', (req, res, next)=>{//check if info is correct GET
    var room = req.query.room;
    var password = req.query.password;
    if(rooms[room] == undefined){//checking if room exists
        res.send('Room does not exist.');
    }
    else if(rooms[room]['password'] != password){//checking for correct password
        res.send('Incorrect password.');
    }
    else{//room exists and password is correct
        res.send('Access granted.');
    }
});

app.post('/send', (req, res, next)=>{//post message
    var room = req.query.room;
    var password = req.query.password;
    var message = req.query.message;

    if(rooms[room] == undefined){//checking if room exists
        res.send('Room does not exist.');
    }
    else{
        if(password == rooms[room]['password']){//password is correct
            //sanitize
            message = message.replace(/</gi, '');
            message = message.replace(/>/gi, '');
            message = message.replace(/;/gi, '');

            rooms[room]['messages'].push(message);
            res.send('Message sent.');

            // -- DO NOT ENABLE ON LIVE VERSION --
                console.log(rooms[room]['messages']);
            // -- -- -- -- -- -- -- -- -- -- -- --
            
        }
        else{//password is incorrect
            res.send('Incorrect password.');
        }
    }
});

app.get('/messages', (req, res, next)=>{//get messages
    var room = req.query.room;
    var password = req.query.password;
    if(rooms[room] == undefined){//checking if room exists
        res.send('Room does not exist.');
    }
    else{
        if(password == rooms[room]['password']){//password is correct
            var messages = rooms[room]['messages'].join(';');
            res.send(`#${rooms[room]['welcomeMessage']};${messages}`);
        }
        else{//password is incorrect
            res.send('Incorrect password.');
        }
    }
});

//404
app.use((req, res, next)=>{//404 page (sends to login)
    res.status(404).sendFile(__dirname + '/login/login.html');
});