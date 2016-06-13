var Botkit = require('botkit');
var sqlite3 = require('sqlite3').verbose();

var controller = Botkit.slackbot({
  debug: true,
  log: 7
  //include "log: false" to disable logging
  //or a "logLevel" integer from 0 to 7 to adjust logging verbosity
});

// connect the bot to a stream of messages
controller.spawn({
  token: "xoxb-49262453889-vwbBSCPbIFTtLCcin8gJBHVy",
}).startRTM()

// give the bot something to listen for.
controller.hears(['hello',"o/","O/","0/","hi"],['direct_message','direct_mention','mention'],function(bot,message) {
  bot.reply(message,'Hello yourself.');
});

controller.hears("version",["direct_message","direct_mention","mention"],function(bot,message) {
  bot.reply(message, "mb v2");
});

controller.hears('uptime',['direct_message','direct_mention','mention'],function(bot,message) {
  bot.reply(message, "Uptime: " + formatUptime(process.uptime()));
});

controller.hears('test',['message'], function(bot, message) {
  bot.reply(message, "Test received.");
});

controller.hears("ban",['direct_mention'],function(bot,message) {
  console.log(message);
  bot.reply(message, "Not implemented.");
});

controller.hears("help",['direct_mention'],function(bot,message) {
  bot.reply(message, "Welcome to automoderator! Available commands: hello, uptime, help");
});

function formatUptime(uptime) {
    seconds = Math.floor(uptime);
    minutes = 0;
    hours = 0;
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
