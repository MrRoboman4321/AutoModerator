var slackbot = require('slackbots');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('memebot.db');
var calendar = require('./calendar.js');
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

var mBuffer = [];

var params = {
  as_user: true
};

bot.on('start', function() {
    db.serialize(function() {
        db.run("CREATE TABLE if not exists suggestions (suggestion TEXT)");
        db.run("CREATE TABLE if not exists users (name TEXT, calendar TEXT, github TEXT)");
    });
    timeStart = Date.now();

    //https://api.slack.com/methods/chat.postMessage


    //bot.postMessageToUser('katanacorgi', 'I AM BEAUTIFUL', params);
});

bot.on('close', function() {
  db.close();
});

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
        if(data.text.indexOf("automoderator") != -1 || data.text.indexOf("<@U1F7QDBS5>:") != -1 || data.text.indexOf("am")) {//If I have been mentioned
            console.log("Mentioned!");
            message = data.text.split(" ");
            if(message[0] == "!automoderator" || message[0] == "<@U1F7QDBS5>:" || message[0] == "!am") {//Its a command
                message[1] = message[1].toLowerCase();
                if(message[1] == "help") {
                    postMessage("Currently available commands are: help, version, uptime, suggest", room, roomType);
                } else if(message[1] == "version") {
                    postMessage("Current version is mb v2", room, roomType);
                } else if(message[1] == "uptime") {
                    postMessage("Uptime: " + formatUptime(), room, roomType);
                } else if(message[1] == "suggest") {
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
                } else if(message[1] == "register") {
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
                } else if(message[1] == "markov") {
					execSync("python markov.py " + message[2].toString() + " " + message[3].toString() + ".txt");
					fs.readFile("line.txt", 'utf-8', function(err, res) {
						postMessage(res, room, roomType);
					});
				} else if(message[1] == "link" && message[3] != "key") {
                    if(message[2] == "calendar" || message[2] == "google") {
                        db.serialize(function() {
                            db.get("SELECT * FROM users WHERE name = ?", user, function(err, row) {
                                if(err) {
                                    console.log("SQL Error finding user entry: " + err);
                                } else {
                                    if(row == undefined) {
                                        postMessage("Please register with AutoModerator using the command \'@automoderator: register", room, roomType);
                                    } else if(row.calendar != null) {
                                        console.log(row.calendar);
                                        postMessage("You already have a google api key!", room, roomType);
                                    } else {
                                        url = calendar.authenticateUser(user);
                                        postMessage("Please visit this link to authorize with AutoModerator: " + url + " . Your code will look like this (it will show up in the URL bar): \'https://www.google.com/?code= <YOUR CODE HERE> &gws_rd=ssl#\'. Copy that to your clipboard, then reply with the command \'@automoderator: link key google <your code> *IN PRIVATE CHAT*.", room, roomType);
                                    }
                                }
                            });
                        });
                    } else {
                        postMessage("Unknown service, services currently available are: Google", room, roomType);
                    }
                } else if(message[3] == "key") {
                      console.log("Key");
                      if(message[2] == "google" || message[2] == "calendar") {
                          db.serialize(function() {
                              db.run("UPDATE users SET calendar = ? WHERE name = ?", message[4], user);
                              postMessage("Key recorded!", room, roomType);
                          });
                      }
                } else if(message[1] == "schedule") {
                    //key, startDate, endDate, organizer, calendarName, title, summary
                    summary = "";
                    for(i = 6; i<message.length; i++) {
                        summary += message[i] + " ";
                    }
                    try {
                        db.serialize(function() {
                            db.get("SELECT calendar FROM users WHERE name = ?", user, function(err, key) {
                                console.log(key);
                                calendar.newEvent(key.calendar, message[2], message[2], user, message[3], message[4], summary);
                                postMessage("Calendar Event Recorded!", room, roomType);
                            });
                        });
                    } catch(err) {
                        postMessage("Error occursed, contact Eli with this: " + err);
                    }
                } else {
                    if(roomType == "g" || roomType == "d") {
                        if(room != "programming") {
                            postMessage("Piss off", room, roomType);
                        }
                    } else {
                        postMessage("Unknown command. List commands with help", room, roomType);
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

function postMessage(message, room, type) {
    if(type == "g") {
        bot.postMessageToGroup(room, message, params);
    } else if(type == "c") {
        bot.postMessageToChannel(room, message, params);
    } else if(type == "d") {
        bot.postMessageToUser(room, message, params);
    }/*Implement direct messaging*/
}
