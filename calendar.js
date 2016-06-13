var fs = require('fs');
var readline = require('readline');
var google = require('googleapis');
var googleAuth = require('google-auth-library');

var exports = module.exports = {};

// If modifying these scopes, delete your previously saved credentials
// at ~/.credentials/calendar-nodejs-quickstart.json

var SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
var TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH ||
    process.env.USERPROFILE) + '/.credentials/calendars';
var TOKEN_PATH = TOKEN_DIR + 'calendar-nodejs-quickstart';

var clientSecret;
var clientId;
var redirectUrl;


exports.authenticateUser = function(name) {
    content = fs.readFileSync('client_secret.json');
    // Authorize a client with the loaded credentials, then call the
    // Google Calendar API.
    url = authorize(JSON.parse(content), listEvents, name);
    console.log(url + "     LAST");
    return url;
}

// Load client secrets from a local file.


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 *
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback, name) {
  console.log(credentials);
  clientSecret = credentials.web.client_secret;
  clientId = credentials.web.client_id;
  redirectUrl = "http://www.google.com";
  var auth = new googleAuth();
  var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  token = getNewToken(oauth2Client, callback, name);
  return token;
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */

function getNewToken(oauth2Client, callback, name) {
  var authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log(authUrl);
  return(authUrl);
}

function processCode(code) {
  oauth2Client.getToken(code, function(err, token) {
    if (err) {
      console.log('Error while trying to retrieve access token', err);
      return;
    }
    oauth2Client.credentials = token;
    storeToken(token, name);
    callback(oauth2Client);
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH + name + ".json", JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH + name + ".json");
}

/**
 * Lists the next 10 events on the user's primary calendar.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth) {
  var calendar = google.calendar('v3');
  calendar.events.list({
    auth: auth,
    calendarId: 'primary',
    timeMin: (new Date()).toISOString(),
    maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime'
  }, function(err, response) {
    if (err) {
      console.log('The API returned an error: ' + err);
      return;
    }
    var events = response.items;
    if (events.length == 0) {
      console.log('No upcoming events found.');
    } else {
      console.log('Upcoming 10 events:');
      for (var i = 0; i < events.length; i++) {
        var event = events[i];
        var start = event.start.dateTime || event.start.date;
        console.log('%s - %s', start, event.summary);
      }
    }
  });
}

exports.newEvent = function (key, startDate, endDate, organizer, calendarName, title, summary) {
    var calendar = google.calendar('v3');
    auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);
    console.log("Calendar side: " + key);
    oauth2Client.credentials = key;
    calendar.events.insert({
        auth: oauth2Client,
        calendarId: calendarName,
        start: startDate,
        end: endDate,
        organizer: organizer,
        summary: title,
        description: summary
    });
}
