//Delete a room
const fs = require('fs');
const chalk = require('chalk');
const room = process.argv[2];
var rooms;

fs.readFile('rooms.json', function(err, data){
    if(err){
        console.log(chalk.red('Failed to read rooms.json.'));
        throw err;
    }
    rooms = JSON.parse(data);
    delete rooms[room];
    rooms['names'] = rooms['names'].filter(e => e !== room);
    fs.writeFile('rooms.json', JSON.stringify(rooms), function(err, data){
        if(err){
            console.log(chalk.red('Failed to write to rooms.json.'));
            throw err;
        }
        console.log(chalk.green(`Deleted ${room}!`));
    });
});