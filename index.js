//begin of declaration of libraries
const express = require("express");//WEBSERVER LIBRARY
const replace = require("replace-in-file");//LIBRARY FOR REPLACING FILE CONTENT
const path = require("path")//LIBRARY FOR FILE DIRECTORY
var bodyParser = require("body-parser"); //PARSING POST URL QUERIES
const fs = require("fs");//FILE SYSTEM
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var request = require('request'); //for the captcha and etc
const sqlite3 = require('sqlite3').verbose();
var { accountSid, authToken, gcaptchac } = require('./config.json'); //make ur own
//end of declaration of libraries
var schedule = require('node-schedule'); //schedule the daily code
const client = require('twilio')(accountSid, authToken); //YOU NEED YOUR OWN BOY


//begin of global variables
var app = express();
var port = 80;//PORT
var nf;
var ide, name, month, date, time, pn, loc; //PARAMETERS 
var options;
//end of global variables


//islogged = the full name
//isloggedname = the username

function getmonth1() { // Return the month based on the Date object
    var d = new Date();
    var month = new Array();
    month[0] = "January";
    month[1] = "February";
    month[2] = "March";
    month[3] = "April";
    month[4] = "May";
    month[5] = "June";
    month[6] = "July";
    month[7] = "August";
    month[8] = "September";
    month[9] = "October";
    month[10] = "November";
    month[11] = "December";
    return month[d.getMonth()]; //return month string
}

var rule = new schedule.RecurrenceRule();
rule.hour = 7;
rule.minute = 45;
rule.second = 0;
var j = schedule.scheduleJob(rule, function () { //every single day at rule.hour:rule.minute, it will send a reminder to everyone that is signed up for a test on that day
    fs.readdir(__dirname + '/events', function (err, files) { //read all the files in a folder
        //handling error
        if (err) {
            return console.log('Unable to scan directory: ' + err);
        }
        if (files.length == 0) {
            return console.log('No events to scan');
        }
        //listing all files using forEach
        files.forEach(function (file) { //do this for every single event/file
            var month = getmonth1(); 
            var day = new Date().getDate();
            if (file == 'eventlist.json') { //we don't want the event list to be parsed and used
                return 0;
            }
            var data = JSON.parse(fs.readFileSync(__dirname + `/events/${file}`)); // read the file
            if (data.date.day.length == 3) { //if the date is like 1st, then shorten it to 1
                data.date.day = data.date.day.substring(0, 1);
            } else {
                data.date.day = data.date.day.substring(0, 2); // if the date is like 12th, then shorten it to 12
            }
            if (!(parseInt(data.date.day) == parseInt(day) && data.date.month === month)) { // if the current date doesnt match the date on file, then dont run the rest of the code
                return 0;
            }
            /*
             * Following 3 code blocks SMS the people working the event
             */
            if (data.people.sound) {
                searchuser('username', data.people.soundpass, function (r) {
                    messageuser(`${data.people.sound}, A reminder that the event, ${data.name}, is scheduled for ${data.date.month} ${data.date.day} is coming up at ${data.time} and that you are working the sound position.`, r.pnumber);
                });
            }
            if (data.people.lights) {
                searchuser('username', data.people.lightpass, function (r) {
                    messageuser(`${data.people.lights}, A reminder that the event, ${data.name}, is scheduled for ${data.date.month} ${data.date.day} is coming up at ${data.time} and that you are working the lights position.`);
                })
            }
            if (data.people.backstage) {
                searchuser('username', data.people.backstagepass, function (r) {
                    messageuser(`${data.people.backstage}, A reminder that the event, ${data.name}, is scheduled for ${data.date.month} ${data.date.day} is coming up at ${data.time} and that you are working the backstage position`);
                })
            }
        });
    });
});


//begin of settings for express
app.use(cookieParser());
app.use(helmet());
app.use(function (req, res, next) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //log the ip of a visitor
    try {
        if (req.cookies.islogged) {
            var content = JSON.parse(fs.readFileSync(__dirname + '/data/loguser.json'));
            content.log.push({ "ip": ip, "name": req.cookies.islogged, "username": req.cookies.isloggedname, "webpage": req.path, "date": new Date() });
        } else {
            var content = JSON.parse(fs.readFileSync(__dirname + '/data/log.json'));
            content.log.push({ "ip": ip, "webpage": req.path, "time": new Date() });
            fs.writeFileSync(__dirname + "/data/log.json", JSON.stringify(content));
        }
    } catch (e) {
        console.log("error:" + e);
    }
    next();
});
app.use('/admin/*', (req, res, next) => { //if anyone tries to go to any url thats like /admin/anything then it will check to see if they have admin privledges cookie
    if (authenticated(req)) {
        next();
    } else {
        res.redirect('/login/admin')
    }
})
app.use(bodyParser.json()); //USE BODYPARSER
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views'); //SET THE VIEW FOLDER
app.set('view engine', 'pug'); //SET THE VIEW ENGINE
//end of settings for express


/*
   _____           _   _               __
  / ____|         | | (_)             /_ |
 | (___   ___  ___| |_ _  ___  _ __    | |
  \___ \ / _ \/ __| __| |/ _ \| '_ \   | |
  ____) |  __/ (__| |_| | (_) | | | |  | |
 |_____/ \___|\___|\__|_|\___/|_| |_|  |_|

*/

//ADMIN PANEL
//search: panel1
app.get("/admin/panel", function (req, res) {
    res.sendFile("/views/panel.html", { root: __dirname });
});

app.get('/login/user', (req, res) => {
    res.render('login');  //login page
});
//Create event page (Crew Chief Only)
//search: createevent1
app.get("/admin/createevent", (req, res) => {
    res.sendFile("/views/createevent.html", { root: __dirname });
});

app.get('/login/admin', (req, res) => {
    res.render("loginadmin", { root: __dirname }); //admin log in page
});
app.get('/events/:eventId/delete', (req, res) => { //unsignup for event page
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`))
    res.sendFile("/views/delete.html", { root: __dirname });
});
//Event list page
//search: event1
app.get("/events", (req, res) => { //LIST OF EVENTS
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    var u = checkiflogged(req);
    var el = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"))
    res.render("index", { els: el.events, username: u });
});

app.post('/user/logout', (req, res) => { //log out and destroy cookies
    res.clearCookie('islogged');
    res.clearCookie('isloggedname');
    res.redirect(req.header('Referer') || '/');
})


//Dynamic page for an event
//search: eventpage1
app.get('/events/:eventId', (req, res) => { // RETRIEVE DATA OF EVENT
    var admin = authenticated(req);
    var u = checkiflogged(req);
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    res.render("viewpage", { datai: data, isadmin: admin, username: u })
});


//redirects to events
// search: eventredirect1
app.get("/", (req, res) => { //MAIN PAGE REDIRECT TO EVENTS
    res.redirect("/events");
});

app.get('/admin/users', function (req, res) { //show all the users in the userbase
    var db = new sqlite3.Database('./user.db', (err) => {
        if (err) {
            console.error(err);
        }
    });
    db.all('SELECT * FROM user', function (err, row) {
        res.render('userlist', { list: row });
    });
})

//the signup for the event page
// search: signup1
app.get('/events/:eventId/signup', (req, res) => { //signup
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    var u = req.cookies.isloggedname;
    var n = req.cookies.islogged;
    res.render("signup", { datai: data, username: u, name: n });
});

//Unsign up for event page
// search: unsignup1
app.get('/events/:eventId/:position/delete', (req, res) => {
    unsignup(req, res)
});

//join the waitlist page
// search: waitlist1
app.get('/events/:eventId/waitlist', (req, res) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    var u = req.cookies.isloggedname;
    var n = req.cookies.islogged;
    res.render('waitlist', { datai: data, username: u, name: n });
});


/* 
   _____           _   _               ___
  / ____|         | | (_)             |__ \
 | (___   ___  ___| |_ _  ___  _ __      ) |
  \___ \ / _ \/ __| __| |/ _ \| '_ \    / /
  ____) |  __/ (__| |_| | (_) | | | |  / /_
 |_____/ \___|\___|\__|_|\___/|_| |_| |____|

*/

//Create an event post
// search: createeventpost
app.post('/login/user', (req, res) => {
    var db = new sqlite3.Database('./user.db', (err) => {
        if (err) { console.log(err) };
    });
    db.serialize(function () {
        db.get(`SELECT * FROM user WHERE username=? OR pnumber=?`, [req.body.id, req.body.id], (err, rows) => {
            if (!rows || rows == null || rows == undefined) {
                res.send('no user with that name or number');
            } else {
                if (rows.password == req.body.password) {
                    res.cookie('islogged', rows.name, { maxAge: 3600000, httpOnly: true });
                    res.cookie('isloggedname', rows.username, { maxAge: 3600000, httpOnly: true });
                    res.redirect(req.header('Referer') || '/');
                } else {
                    res.send("Incorrect password");
                }
            }
        });

    });
    db.close();
})
app.post('/register', (req, res) => { //sign up for an account
    if (!req.body.classpass == 'stage2019') {
        res.render('error', { error: "Incorrect Class Code" }); //make sure no random people sign up
    }
    var db = new sqlite3.Database('./user.db', (err) => {
        if (err) {
            console.error(err);
        }
    });
    if (req.body['g-recaptcha-response'] === undefined || req.body['g-recaptcha-response'] === '' || req.body['g-recaptcha-response'] === null) {
        return res.json({ "responseCode": 1, "responseDesc": "Please select captcha" });
    }
    // Put your secret key here.
    var secretKey = gcaptchac;
    // req.connection.remoteAddress will provide IP address of connected user.
    var verificationUrl = "https://www.google.com/recaptcha/api/siteverify?secret=" + secretKey + "&response=" + req.body['g-recaptcha-response'] + "&remoteip=" + req.connection.remoteAddress;
    // Hitting GET request to the URL, Google will respond with success or error scenario.

    request(verificationUrl, function (error, response, body) {
        try {
            body = JSON.parse(body);
            // Success will be true or false depending upon captcha validation.
            if (body.success !== undefined && !body.success) {
                res.json({ "responseCode": 1, "responseDesc": "Failed captcha verification" });
            }
        } catch (e) {
            res.render('error', { error: e });
        }
    });
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    checkdb(db, req, req.body.pnumber, (row1, p) => {
        try {
            if (row1 == undefined) {
                db.serialize(function () {
                    db.run('CREATE TABLE IF NOT EXISTS user(username TEXT, name TEXT, password TEXT, pnumber varchar(15), originip varchar(15))');
                    db.run('INSERT INTO user(username, name, password, pnumber, originip) VALUES(?, ?, ?, ?, ?)', [req.body.username, req.body.fullname, req.body.password, req.body.pnumber, ip]);
                    db.close();
                });
                res.cookie('islogged', req.body.fullname, { maxAge: 3600000, httpOnly: true });
                res.cookie('isloggedname', req.body.username, { maxAge: 3600000, httpOnly: true });
                res.redirect(req.header('Referer') || '/');
                var pnumber = numberify(req.body.pnumber);
                messageuser(`Thank you ${req.body.fullname}, for creating an account on the Crew Calendar! You will be texted notifications! To stop these notifications, please message STOP`, pnumber)
            } else {
                throw "There is already a user with this info";
            }
        } catch (e) {
            res.render('error', { error: e })
        }
    });

});

function numberify(input) { //turn a regular number string into a string that twilio will understand, e.g. +17166081923
    return '+1' + input.toString().replace(/\s/g, '');
}

app.post("/events/addnew", (req, res) => { //MAIN POST FUNCTION - GENERATE EVENT FILE | allows either url param or body
    ide = req.query.ide || req.body.ide || Math.floor((Math.random() * 10000) + 1000); //e.g. ?id=127852
    name = req.query.name || req.body.name; //e.g. ?name=winterconcert
    month = req.query.month || req.body.month; //e.g. ?month=March
    day = req.query.day || req.body.day; // e.g. ?day=24
    time = req.query.time || req.body.time; //e.g. ?time=5:30
    loc = req.query.loc || req.body.loc;
    pn = req.query.pn || req.body.pn; //positions needed e.g. ?pn=1-3
    var year = new Date().getFullYear().toString();
    nf = __dirname + "/events/" + ide + ".json"; //FILE LOCATIONs
    try {
        if (!fs.existsSync(nf)) {
            fs.copyFileSync(__dirname + "/template.json", nf);
            //following code replaces strings in the newly made file that is identical to the template
            replaceall(nf, "templateevent", name);
            replaceall(nf, "monthi", month);
            replaceall(nf, "dayi", day);
            replaceall(nf, "timei", time);
            replaceall(nf, "loci", loc);
            replaceall(nf, "idi", ide);
            replaceall(nf, "yeari", year)
            if (pn == 1) {
                replaceall(nf, "posi", "Sound Only");
            } else if (pn == 2) {
                replaceall(nf, "posi", "Sound & Lights");
            } else if (pn == 3) {
                replaceall(nf, "posi", "Sound & Lights & Backstage");
            } else {
                throw "INVALID POSITION"
            }
            // end
            addtofile(ide, name, `${month} ${day}, ${year}`, pn); //add to event list 
            res.send(`<!doctype html><html lang="en"><head><meta name='viewport' content='width=device-width, initial-scale=1' /></head><body>REQUEST SUCCESSFUL. ID: + ${ide} +. Write this down. <br><a href='/events/${ide}'>Click here to go to the event</a><br><a href='/'>Click here to go to the home page</a></body></html>`); //result send back status
        } else {
            throw "There is already an event with that ID";
        }
    } catch (e) {
        res.render('error', { error: e });
    }
});

//Post for login, authenticates the passcode and sets the cookie. Very unsecure
// search: loginpost
app.post('/login/admin', (req, res) => {
    if (req.body.pass == "6456") {
        res.cookie("auth", "authenticated", { maxAge: 86400000 });
        res.redirect("/admin/panel");
    }
});

//Delete an event post
// search: eventdeletepost
app.post('/events/:eventId/delete', (req, res) => {
    fs.unlinkSync(__dirname + `/events/${req.params.eventId}.json`);
    var a = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    for (i = 0; i < a.events.length; i++) {
        if (a.events[i].id == req.params.eventId) {
            a.events.splice(i, 1);
        }
    }
    fs.writeFileSync(__dirname + `/events/eventlist.json`, JSON.stringify(a));
    res.redirect("/events")
});

//the post url where the data from the event signup page goes to
// search: signuppost
app.post('/events/:eventId/setpos', (req, res) => {
    try {
        var fpos = req.body.pos;
        var fdata = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
        var fname = req.body.name;
        var fpass = req.body.username;
        var pnum;
        if (fpos == "1") {
            if (!('sound' in fdata.people)) {
                if (fname == fdata.people.lights) {
                    throw "You cannot sign up for multiple things"
                } else if (fname == fdata.people.backstage) {
                    throw "You cannot sign up for multiple things"
                } else {
                    fdata.people.sound = fname; //assign person to position
                    fdata.people.soundpass = fpass; //assign password to persons positions
                    searchuser("username", fpass, function (r) {
                        pnum = numberify(r.pnumber);
                        messageuser(`${r.name}, you have been signed up for the Sound Position of ${fdata.name}, on ${fdata.date.month} ${fdata.date.day} at ${fdata.time}! Mark your calendar!`, pnum);
                    })
                }
            } else {
                throw "someone already chose that";
            }
        }
        else if (fpos == "2") {
            if (!(fdata.pos == "Sound Only")) {
                if (!('lights' in fdata.people)) {
                    if (fname == fdata.people.sound) {
                        throw "You cannot sign up for multiple things"
                    } else if (fname == fdata.people.backstage) {
                        throw "You cannot sign up for multiple things"
                    } else {
                        fdata.people.lights = fname; //assign person to position
                        fdata.people.lightpass = fpass; //assign password to persons positions
                        searchuser("username", fpass, function (r) {
                            pnum = numberify(r.pnumber);
                            messageuser(`${r.name}, you have been signed up for the Lights Position of ${fdata.name}, on ${fdata.date.month} ${fdata.date.day} at ${fdaata.time}! Mark your calendar!`, pnum);
                        })
                    }
                } else {
                    throw "someone already chose that";
                }
            } else {
                throw "Lights is not needed for this event"
            }
        }
        else if (fpos == "3") {
            if (!(fdata.pos == "Sound Only" || fdata == "Sound & Lights")) {
                if (!('backstage' in fdata.people)) {
                    if (fname == fdata.people.sound) {
                        throw "You cannot sign up for multiple things"
                    } else if (fname == fdata.people.lights) {
                        throw "You cannot sign up for multiple things"
                    } else {
                        fdata.people.backstage = fname; //assign person to position
                        fdata.people.backstagepass = fpass; //assign password to persons positions
                        searchuser("username", fpass, function (r) {
                            pnum = numberify(r.pnumber);
                            messageuser(`${r.name}, you have been signed up for the Backstage Position of ${fdata.name}, on ${fdata.date.month} ${fdata.date.day} at ${fdaata.time}! Mark your calendar!`, pnum);
                        })
                    }
                } else {
                    throw "someone already chose that";
                }
            } else {
                throw "Backstage is not needed for this event";
            }
        }
        fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(fdata));
        res.redirect(`/events/${req.params.eventId}`);
    } catch (e) {
        res.render('error', { error: e });
    }
});

//post for waitlist
// search: waitlistpost
app.post('/events/:eventId/waitlist', (req, res) => {
    try {
        addtowaitlist(req, res, req.body.name, req.body.username);
        res.redirect(`/events/${req.params.eventId}`);
    } catch (e) {
        res.render("error", { error: e });
    }
});

/*
   _____           _   _               ____
  / ____|         | | (_)             |___ \
 | (___   ___  ___| |_ _  ___  _ __     __) |
  \___ \ / _ \/ __| __| |/ _ \| '_ \   |__ <
  ____) |  __/ (__| |_| | (_) | | | |  ___) |
 |_____/ \___|\___|\__|_|\___/|_| |_| |____/


*/
//Capitalize the first letter of a word
var capitalize = (s) => {
    return s.charAt(0).toUpperCase() + s.slice(1);
};

var authenticated = (r) => { //see if the user has the admin cookie, easily exploitable, I dont really got anything else without putting a lot more effort in
    if (r.cookies.auth == undefined || r.cookies.auth == null) {
        return false
    } else if (r.cookies.auth == "authenticated") {
        return true;
    }
};

function messageuser(message, recepient) { //function to message a person using twilio
    client.messages
        .create({
            body: message,
            from: '+17162216438',
            to: recepient
        });
}
var addtowaitlist = (req, res, n, p) => { //add a user to the waitlist
    var path = __dirname + `/events/${req.params.eventId}.json`;
    var data = JSON.parse(fs.readFileSync(path));
    var position = req.body.pos;
    if (!('waitlist' in data.people)) { //if there is no waitlist, meaning no one has joined the waitlist, create it
        data.people.waitlist = {};
    }
    if (position == 1) {
        if (!(n == data.people.sound || n == data.people.lights || n == data.people.backstage)) {
            if (!('sound' in data.people.waitlist)) {
                data.people.waitlist.sound = [];
            }
            data.people.waitlist.sound.push({ "name": n, "pass": p });
            searchuser('username', p, function (r) { //make sure person is in userbase
                messageuser(`Hey there, ${n}, you have been added to waitlist for the sound position of ${data.name}, on ${data.date.month} ${data.date.day}`, r.pnumber);
            })
        } else {
            throw "You are already in a position!";
        }
    } else if (position == 2) {
        if (!(n == data.people.sound || n == data.people.lights || n == data.people.backstage)) {
            if (!('lights' in data.people.waitlist)) {
                data.people.waitlist.lights = [];
            }
            data.people.waitlist.lights.push({ "name": n, "pass": p });
            searchuser('username', p, function (r) {//make sure person is in userbase
                messageuser(`Hey there, ${n}, you have been added to waitlist for the lights position of ${data.name}, on ${data.date.month} ${data.date.day}`, r.pnumber);
            })
        } else {
            throw "You are already in a position!";
        }
    } else if (position == 3) {
        if (!(n == data.people.sound || n == data.people.lights || n == data.people.backstage)) {
            if (!('backstage' in data.people.waitlist)) {
                data.people.waitlist.backstage = [];
            }
            data.people.waitlist.backstage.push({ "name": n, "pass": p });
            searchuser('username', p, function (r) { //make sure person is in userbase
                messageuser(`Hey there, ${n}, you have been added to waitlist for the backstage position of ${data.name}, on ${data.date.month} ${data.date.day}`, r.pnumber);
            })
        } else {
            throw "You are already in a position!";
        }
    }
    fs.writeFileSync(path, JSON.stringify(data)); //write to file the changes made

}

var addtofile = (id1, name1, date, pos) => { //ADD TO ARRAY OF EVENTLIST JSON
    var position;
    if (pos == 1) {
        position = "Sound Only";
    } else if (pos == 2) {
        position = "Sound & Lights";
    } else if (pos == 3) {
        position = "Sound & Lights & Backstage";
    }
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    var result = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    result.events.unshift({ "id": id1, "name": name1, "date": date, "position": position });
    fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify(result));
};
var replaceall = (a, b, c) => { //CHANGE CONTENT OF NEW JSON FILE
    options = {
        "files": a,
        "from": b,
        "to": c
    }
    replace.sync(options);
};
var generate = () => { //generate some of the folders and files that contain unique things to each system
    if (!fs.existsSync("events")) {
        fs.mkdirSync("events");
    }
    if (!fs.existsSync("data")) {
        fs.mkdirSync("data");
    }
    if (!fs.existsSync(__dirname + "/data/log.json")) { //log ip of all pages
        fs.writeFileSync(__dirname + "/data/log.json", JSON.stringify({ "log": [] }));
        console.log("Log created");
    }
    if (!fs.existsSync(__dirname + "/data/loguser.json")) { //log data of logged in users
        fs.writeFileSync(__dirname + "/data/loguser.json", JSON.stringify({ "log": [] }));
        console.log("User Log created");
    }
};
var checkwaitlist = (a, p) => { //check the waitlist if there are any users in it, if there are, then take them from the waitlist and add them to the event
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${a}.json`));
    if (p == "sound") {
        if (data.people.waitlist.sound.length > 1) { //if there is more than one person in the waitlist for this position
            var temp = data.people.waitlist.sound.shift();; //temp variable to take place of first person in waitlist
            data.people.sound = temp.name;
            data.people.soundpass = temp.pass;
        } else if (data.people.waitlist.sound.length === 1) { //if there is only one person in the waitlist for this position
            var temp = data.people.waitlist.sound[0]; //temp variable to take place of only person in waitlist
            data.people.sound = temp.name;
            data.people.soundpass = temp.pass;
            delete data.people.waitlist.sound;
        }
        searchuser('username', temp.pass, function (r) {
            messageuser(`${r.name}, you now have the position of Sound for ${data.name}, on ${data.date.month} ${data.date.day}`); //inform person that they are out of the waitlist
        });
    } else if (p == "lights") {
        if (data.people.waitlist.lights.length > 1) { //if there is more than one person in the waitlist for this position
            var temp = data.people.waitlist.lights.shift(); //temp variable to take place of first person in waitlist
            data.people.lights = temp.name;
            data.people.lightpass = temp.pass;
        } else if (data.people.waitlist.lights.length === 1) { //if there is only one person in the waitlist for this position
            var temp = data.people.waitlist.lights[0]; //temp variable to take place of only person in waitlist
            data.people.lights = temp.name;
            data.people.lightpass = temp.pass;
            delete data.people.waitlist.lights;
        }
        searchuser('username', temp.pass, function (r) {
            messageuser(`${r.name}, you now have the position of Lights for ${data.name}, on ${data.date.month} ${data.date.day}`); //inform person that they are out of the waitlist
        });
    } else if (p == "backstage") {
        if (data.people.waitlist.backstage.length > 1) { //if there is more than one person in the waitlist for this position
            var temp = data.people.waitlist.backstage.shift(); //temp variable to take place of first person in waitlist
            data.people.backstage = temp.name;
            data.people.backstagepass = temp.pass;
        } else if (data.people.waitlist.backstage.length === 1) { //if there is only one person in the waitlist for this position
            var temp = data.people.waitlist.backstage[0]; //temp variable to take place of only person in waitlist
            data.people.backstage = temp.name;
            data.people.backstagepass = temp.pass;
            delete data.people.waitlist.backstage;
        }
        searchuser('username', temp.pass, function (r) {
            messageuser(`${r.name}, you now have the position of Backstage for ${data.name}, on ${data.date.month} ${data.date.day}`); //inform person that they are out of the waitlist
        });
    }
    if (!('sound' in data.people.waitlist) && !('lights' in data.people.waitlist) && !('backstage' in data.people.waitlist)) { //if there is no one in any waitlist, delete the waitlist
        console.log('no u i mean');
        delete data.people.waitlist;
    }
    fs.writeFileSync(__dirname + `/events/${a}.json`, JSON.stringify(data));
};

function checkdb(db1, req, pnumber, callback) { //check the database for an existing user
    db1.serialize(function () {
        db1.get("SELECT DISTINCT * FROM user WHERE username=? OR pnumber=?", [req.body.username, req.body.pnumber], function (error, row) {
            row = JSON.stringify(row);
            callback(row, pnumber);
        });
    });
};

function searchuser(searchm, search, callback) { //check the database based on the params
    var pdb = new sqlite3.Database('./user.db', (err) => {
        if (err) { console.log(err) };
    });
    pdb.serialize(function () {
        pdb.get(`SELECT DISTINCT * FROM user WHERE ${searchm}=?`, [search], (err, row) => {
            callback(row);
        });
    });
    pdb.close();
};

var unsignup = (req, res) => { //unsignup from the event
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    try {
        if ((!req.cookies.islogged || !req.cookies.isloggedname) && !req.cookies.auth) {
            throw "YOU ARE NOT LOGGED IN";
        }
        if (req.params.position == "sound") {
            if (req.cookies.isloggedname == data.people.soundpass || authenticated(req)) {
                delete data.people.sound; //get rid of the person
                delete data.people.soundpass; //get rid of the persons password
                searchuser('username', req.cookies.isloggedname, function (r) { //inform them using twilio
                    pnum = numberify(r.pnumber);
                    messageuser(`${r.name}, you have been unsigned up for the Sound Position of ${data.name}`, pnum);
                })
            } else {
                throw "You are not the user that signed up!";
            }
        } else if (req.params.position == "lights") {
            if (req.cookies.isloggedname == data.people.lightpass || authenticated(req)) {
                delete data.people.lights; //get rid of the person
                delete data.people.lightpass; //get rid of the persons password
                searchuser('username', req.cookies.isloggedname, function (r) {
                    pnum = numberify(r.pnumber);
                    messageuser(`${r.name}, you have been unsigned up for the Lights Position of ${data.name}`, pnum)
                });
            } else {
                throw "You are not the user that signed up!";
            }
        } else if (req.params.position == "backstage") {
            if (req.cookies.isloggedname == data.people.backstagepass || authenticated(req)) {
                delete data.people.backstage; //get rid of the person
                delete data.people.backstagepass; //get rid of the persons password
                searchuser('username', req.cookies.isloggedname, function (r) {
                    pnum = numberify(r.pnumber);
                    messageuser(`${r.name}, you have been unsigned up for the Backstage Position of ${data.name}`, pnum)
                })
            } else {
                throw "You are not the user that signed up!";
            }
        }
        fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(data));
        if ('waitlist' in data.people) { //if theres a waitlist, then see if anyones in it that can be put in there now
            checkwaitlist(req.params.eventId, req.params.position);
        }
        res.redirect(`/events/${req.params.eventId}`);
    } catch (e) {
        res.render('error', { error: e });
    }
};
function checkiflogged(r) { //check if there are logged in cookies
    var username1 = "";
    if (r.cookies.islogged) {
        username1 = r.cookies.islogged;
    }
    return username1;
}

app.get('*', (req, res) => { //404 page, any page that doesnt exist redirects to / => /events
    res.status(404);
    res.redirect('/');
});

app.listen(port, () => { //START WEBSERVER
    console.log(`The server has started on ${port}`);
    generate();
});