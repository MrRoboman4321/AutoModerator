var slackbot = require('slackbots');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('memebot.db');
var fs = require('fs');
var execSync = require("child_process").execSync;
var firstline = require("firstline")

token = JSON.parse(fs.readFileSync("token.json")).token;
console.log(token);

var bot = new slackbot({
    token: token, // Add a bot https://my.slack.com/services/new/bot and put the token
    name: 'automoderator'
});
var timeStart = 0;

var params = {
  as_user: true
};

bot.on('start', function() {
    db.serialize(function() {
        db.run("CREATE TABLE if not exists suggestions (suggestion TEXT)");
        db.run("CREATE TABLE if not exists users (name TEXT, calendar TEXT, github TEXT)");
    });
    timeStart = Date.now();
});

bot.on('close', function() {
  db.close();
});

function cHelp(message, room, roomType) {
    commandList = []
    if(message.length == 2) { //Asking for command list
        for (var command in commands) {
            if (commands.hasOwnProperty(command) && commands[command]["visible"]) {
                commandList.push(command);
            }
        }

        list = commandList.join(", ");
        postMessage("Available commands: " + list, room, roomType);
    } else if(message.length == 3) { //Asking for help for a specific command
        if(commands.hasOwnProperty(message[2])) { //Command actually exists
            postMessage(commands[message[2]]["help_string"], room, roomType);
        } else { postMessage(commands["help"]["help_string"], room, roomType); }
    } else { postMessage(commands["help"]["help_string"], room, roomType); }
}

function cVersion(message, room, roomType) {
    postMessage("I don't keep track of version numbers.", room, roomType);
}

function cUptime(message, room, roomType) {
    postMessage("Uptime: " + formatUptime(), room, roomType);
}

function cSuggest(message, room, roomType) {
    db.serialize(function() {
        sql = db.prepare("INSERT INTO suggestions VALUES (?)");
        suggestion = "";
        for(i = 2; i<message.length; i++) {
            suggestion += message[i] + " ";
        }
        sql.run(suggestion);
        sql.finalize();
    });
    postMessage("Suggestion recorded!", room, roomType);
}

function cRegister(message, room, roomType) {
    db.serialize(function() {
        db.get("SELECT * FROM users WHERE name = ?", user, function(err, row) {
            if(row != undefined) {
                postMessage("You have already registered!", room, roomType);
            } else {
                db.run("INSERT INTO users (name) VALUES (?)", user);
                postMessage("You have been registered!", room, roomType);
            }
        });
    });
}

function cMarkov(message, room, roomType) {
    postMarkov(message[3], message[2], room, roomType);
}

function cTimeToChezy(message, room, roomType) {
    postRandomCatPicture("design", "g");
    postMessage("Days until chezy champs: " + getDaysUntil(27, 9, 2018), "design", "g");
}

commands = {
    'help': {"function": cHelp, "visible": true, "help_string": "Usage: @automod help or @automod help <command>\nUsed to list all available commands, or to get specific help information about a command."}, //visible to the help command
    'version': {"function": cVersion, "visible": true, "help_string": "Usage: @automod version\nShows the version number"},
    'uptime': {"function": cUptime, "visible": true, "help_string": "Usage: @automod uptime\nDisplays time since last restart"},
    'suggest': {"function": cSuggest, "visible": true, "help_string": "Usage: @automod suggest <message>\nSuggests features to be added. No, I won't look."},
    'register': {"function": cRegister, "visible": true, "help_string": "Usage: @automod register\nRegister's your username in the database. Not used."},
    'markov': {"function": cMarkov, "visible": true, "help_string": "Usage: @automod markov <max characters> <channel name>\nCreates a message that looks like it's from the channel specified."},
    'dx4g;[':{"function":  cTimeToChezy, "visible": false, "help_string": "Nope."}
}

bot.on('message', function(data) {
    if(data.type == "message" && data.subtype == undefined) {
        user = getUserById(data.user);
        if(data.channel[0] == "C") {//For Channels
          room = getChannelById(data.channel);
          roomType = "c";
        } else if(data.channel[0] == "G") {//For Groups
          room = getGroupById(data.channel);
          roomType = "g";
        } else if(data.channel[0] == "D") {//For Direct Messages
          room = getUserById(data.user);
          roomType = "d";
        }

        message = data.text.split(" ");

        if(message[0] == "!automoderator" || message[0] == "<@UBGMPTN4V>" || message[0] == "!am") { //I've been mentioned in a command
            for (var command in commands) {
                if (commands.hasOwnProperty(command)) {
                    if(command == message[1].toLowerCase()) { //The command is in the command table
                        commands[command]["function"](message, room, roomType); //Call it with the standard parameters
                    }
                }
            }
        }
    }
});

function getUserById(id) {
    userList = bot.getUsers()._value.members;
    //console.log(userList);
    for(i = 0; i<userList.length; i++) {
        if(userList[i].id == id) {
            return userList[i].name;
        }
    }
    //should never get here, but don't return nothing cause that's bad
    return "\"user not found\"";
}

function getGroupById(id) {
    groupList = bot.getGroups()._value.groups;
    //console.log(channelList);
    //console.log(channelList);

    for(i = 0; i<groupList.length; i++) {
        if(groupList[i].id == id) {
            return groupList[i].name;
        }
    }
    //should never get here, but don't return nothing cause that's bad
    return "\"group not found\"";
}

function getChannelById(id) {
    channelList = bot.getChannels()._value.channels;
    //console.log(channelList);
    //console.log(channelList);

    for(i = 0; i<channelList.length; i++) {
        if(channelList[i].id == id) {
            return channelList[i].name;
        }
    }
    //should never get here, but don't return nothing cause that's bad
    return "\"channel not found\"";
}

function formatUptime() {
    milliseconds = Date.now() - Math.floor(timeStart);
    seconds = 0;
    minutes = 0;
    hours = 0;
    while(milliseconds > 1000) {
      milliseconds -= 1000;
      seconds += 1;
    }
    while(seconds > 60) {
      seconds -= 60;
      minutes += 1;
    }
    while(minutes > 60) {
      minutes -= 60;
      hours += 1;
    }
    console.log("Uptime: " + hours + "h " + minutes + "m " + seconds + "s");
    if(hours === 0 && minutes === 0) {
      console.log("Less than 1 min");
      uptime = seconds + "s";
    } else if(hours === 0) {
      console.log("Greater than a min");
      uptime = minutes + "m " + seconds + "s";
    } else {
      uptime = hours + "h " + minutes + "m " + seconds + "s";
    }
    return uptime;
}

function postMarkov(file, length, channel, roomType) {
    execSync("python3 markov.py " + length + " " + file + ".txt");
    fs.readFile("line.txt", 'utf-8', function(err, res) {
        console.log("Got here. channel: " + channel + ", roomType:" + roomType);
        postMessage(res, channel, roomType);
    });
}

function postRandomCatPicture(channel, roomType){
    fs.readFile("cats.txt", "utf8", function(err, data){
        if(err) throw err;
        var lines = data.split('\n');
        line = lines[Math.floor(Math.random()*lines.length)];
        if(line[0] != "<" && line[line.length-1] != ">") {
            console.log("SKIPPING");
            postRandomCatPicture(channel, roomType);
            return;
        }

        postMessage(line, channel, roomType);
    });
}

function getDaysUntil(day, month, year) {
    until = new Date(year, month-1, day);
    now = new Date();

    seconds = Math.floor((until - (now))/1000);
    minutes = Math.floor(seconds/60);
    hours = Math.floor(minutes/60);
    days = Math.floor(hours/24);

    return days;
}

function postMessage(message, room, type) {
    if(type == "g") {
        bot.postMessageToGroup(room, message, params);
    } else if(type == "c") {
        bot.postMessageToChannel(room, message, params);
    } else if(type == "d") {
        bot.postMessageToUser(room, message, params);
    }/*Implement direct messaging*/
}
