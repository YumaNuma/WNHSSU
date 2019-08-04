//begin of declaration of libraries
const express = require("express");//WEBSERVER LIBRARY
const replace = require("replace-in-file");//LIBRARY FOR REPLACING FILE CONTENT
const path = require("path")//LIBRARY FOR FILE DIRECTORY
var bodyParser = require("body-parser"); //PARSING POST URL QUERIES
const fs = require("fs");//FILE SYSTEM
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
const sqlite3 = require('sqlite3').verbose();
//end of declaration of libraries

//begin of global variables
var app = express();
var port = 80;//PORT
var filedir;//DIRECTORY OF FILE
var nf;
var ide, name, month, date, time, pn, loc; //PARAMETERS 
var options;
//end of global variables

//begin of settings for express
app.use(helmet());
app.use(function (req, res, next) {
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    //log the ip of a visitor
    try {
        var content = JSON.parse(fs.readFileSync(__dirname + '/data/log.json'));
        content.log.push({ "ip": ip, "webpage": req.path, "time": new Date() });
        fs.writeFileSync(__dirname + "/data/log.json", JSON.stringify(content));
    } catch (e) {
        console.log("error:" + e);
    }
    next();
})
app.use(bodyParser.json()); //USE BODYPARSER
app.use(express.static(__dirname + '/views'));
app.use(bodyParser.urlencoded({ extended: true }));
app.set('views', __dirname + '/views'); //SET THE VIEW FOLDER
app.set('view engine', 'pug'); //SET THE VIEW ENGINE
app.use(cookieParser());
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
app.get("/panel", function (req, res) {
    if (authenticated(req)) {
        res.sendFile("/views/panel.html", { root: __dirname });
    } else {
        res.redirect('/login');
    }
});

//Event list page
//search: event1
app.get("/events", (req, res) => { //LIST OF EVENTS
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    var el = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"))
    res.render("index", { els: el.events });
});

//Create event page (Crew Chief Only)
//search: createevent1
app.get("/createevent", (req, res) => {
    if (authenticated(req)) {
        res.sendFile("/views/createevent.html", { root: __dirname });
    } else {
        res.redirect('/login');
    }
});

//Dynamic page for an event
//search: eventpage1
app.get('/events/:eventId', (req, res) => { // RETRIEVE DATA OF EVENT
    var admin = authenticated(req);
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    res.render("viewpage", { datai: data, isadmin: admin })
});

//login (Crew Chief Only)
// search: login1
app.get('/login', (req, res) => {
    res.render("login", { root: __dirname });
});

//redirects to events
// search: eventredirect1
app.get("/", (req, res) => { //MAIN PAGE REDIRECT TO EVENTS
    res.redirect("/events");
});

//Delete an event
// search: delete1
app.get('/events/:eventId/delete', (req, res) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`))
    res.sendFile("/views/delete.html", { root: __dirname });
});

//the signup for the event page
// search: signup1
app.get('/events/:eventId/signup', (req, res) => { //signup
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    res.render("signup", { datai: data });
});

//Unsign up for event page
// search: unsignup1
app.get('/events/:eventId/:position/delete', (req, res) => {
    if (authenticated(req)) {
        unsignup(req, res);
    } else {
        res.sendFile('/views/remove.html', { root: __dirname });
    }
});

//join the waitlist page
// search: waitlist1
app.get('/events/:eventId/waitlist', (req, res) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    res.render('waitlist', { datai: data});
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
        console.log("Connect to login database")
    });
    db.serialize(function () {
        db.get(`SELECT * FROM user WHERE username=?`, [req.body.username], (err, rows) => {
            console.log(rows);
            if (!rows || rows == null || rows == undefined) {
                res.send('NO USER WITH THAT NAME');
            } else {
                if (rows.password == req.body.password) {
                    res.send("Correct Password");
                } else {
                    res.send("Incorrect password");
                }
            }
        });

    });
    db.close();
})
app.post('/register', (req, res) => {
    var db = new sqlite3.Database('./user.db', (err) => {
        if (err) {
            console.error(err);
        }
        console.log('Connected to the login database.');
    });
    db.serialize(function () {
        db.run('CREATE TABLE IF NOT EXISTS user(username TEXT, name TEXT, password TEXT)');
        db.run(`INSERT INTO user(username, name, password) VALUES('${req.body.username}', '${req.body.name}','${req.body.password}')`);
        db.all('SELECT * FROM user', [], (err, rows) => {
            if (err) {
                throw err;
            }
            console.log(rows);
            rows.forEach((row) => {
                console.log(row);
            });
        });
    })    
    db.close();
    res.send('done');
})
app.post("/events/addnew", (req, res) => { //MAIN POST FUNCTION - GENERATE EVENT FILE
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
app.post('/login', (req, res) => {
    if (req.body.pass == "6456") {
        res.cookie("auth", "authenticated", { maxAge: 86400000 });
        res.redirect("/panel");
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

//unsignup for event post
// search: unsignuppost
app.post('/events/:eventId/:position/delete', (req, res) => {
    unsignup(req, res);
});

//the post url where the data from the event signup page goes to
// search: signuppost
app.post('/events/:eventId/setpos', (req, res) => {
    try {
        var fname = req.body.name;
        var fpos = req.body.pos;
        var fdata = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
        var fpass = req.body.pass;
        fname = capitalize(fname);
        if (fpos == "1") {
            if (!('sound' in fdata.people)) {
                if (fname == fdata.people.lights) {
                    throw "You cannot sign up for multiple things"
                } else if (fname == fdata.people.backstage) {
                    throw "You cannot sign up for multiple things"
                } else {
                    fdata.people.sound = fname;
                    fdata.people.soundpass = fpass;
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
                        fdata.people.lights = fname;
                        fdata.people.lightpass = fpass;
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
                        fdata.people.backstage = fname;
                        fdata.people.backstagepass = fpass;
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
    addtowaitlist(req, res);
    res.redirect(`/events/${req.params.eventId}`);
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

var authenticated = (r) => {
    if (r.cookies.auth == undefined || r.cookies.auth == null) {
        return false
    } else if (r.cookies.auth == "authenticated") {
        return true;
    }
};

var addtowaitlist = (req, res) => {
    var path = __dirname + `/events/${req.params.eventId}.json`;
    var data = JSON.parse(fs.readFileSync(path));
    var position = req.body.pos;
    if (!('waitlist' in data.people)) {
        data.people.waitlist = {};
    }
    if (position == 1) {
        if (!('sound' in data.people.waitlist)) {
            data.people.waitlist.sound = [];
        }
        data.people.waitlist.sound.push({"name" : req.body.name, "pass" : req.body.pass});
    } else if (position == 2) {
        if (!('lights' in data.people.waitlist)) {
            data.people.waitlist.lights = [];
        }
        data.people.waitlist.lights.push({ "name": req.body.name, "pass": req.body.pass });
    } else if (position == 3) {
        if (!('backstage' in data.people.waitlist)) {
            data.people.waitlist.backstage = [];
        }
        data.people.waitlist.backstage.push({ "name": req.body.name, "pass": req.body.pass });
    }
    fs.writeFileSync(path, JSON.stringify(data));
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
var generate = () => {
    if (!fs.existsSync("events")) {
        fs.mkdirSync("events");
    }
    if (!fs.existsSync("data")) {
        fs.mkdirSync("data");
    }
    if (!fs.existsSync(__dirname + "/data/log.json")) {
        fs.writeFileSync(__dirname + "/data/log.json", JSON.stringify({ "log": [] }));
        console.log("Log created")
    }
};
var checkwaitlist = (a, p) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${a}.json`));
    if (p == "sound") {
        if (data.people.waitlist.sound.length > 1) {
            var temp = data.people.waitlist.sound.shift();
            data.people.sound = temp.name;
            data.people.soundpass = temp.pass;
        } else if (data.people.waitlist.sound.length == 1) {
            var temp = data.people.waitlist.sound[0];
            data.people.sound = temp.name;
            data.people.soundpass = temp.pass;
            delete data.people.waitlist.sound;
        }
    } else if (p == "lights") {
        if (data.people.waitlist.lights.length > 1) {
            var temp = data.people.waitlist.lights.shift();
            data.people.lights = temp.name;
            data.people.lightpass = temp.pass;
        } else if (data.people.waitlist.lights.length == 1) {
            var temp = data.people.waitlist.lights[0];
            data.people.lights = temp.name;
            data.people.lightpass = temp.pass;
            delete data.people.waitlist.lights;
        }
    } else if (p == "backstage") {
        if (data.people.waitlist.backstage.length > 1) {
            var temp = data.people.waitlist.backstage.shift();
            data.people.backstage = temp.name;
            data.people.backstagepass = temp.pass;
        } else if (data.people.waitlist.backstage.length == 1) {
            var temp = data.people.waitlist.backstage[0];
            data.people.backstage = temp.name;
            data.people.backstagepass = temp.pass;
            delete data.people.waitlist.backstage;
        }
    }
    if (!(('sound' in data.people.waitlist) && ('lights' in data.people.waitlist) && ('backstage' in data.people.waitlist))) {
        delete data.people.waitlist;
    }
    fs.writeFileSync(__dirname + `/events/${a}.json`, JSON.stringify(data));
};
var unsignup = (req, res) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    try {
        if (req.params.position == "sound") {
            if (req.body.pass == data.people.soundpass || authenticated(req)) {
                delete data.people.sound;
                delete data.people.soundpass;
            } else {
                throw "Incorrect Passcode";
            }
        } else if (req.params.position == "lights" || authenticated(req)) {
            if (req.body.pass == data.people.lightpass) {
                delete data.people.lights;
                delete data.people.lightpass;
            } else {
                throw "Incorrect Passcode";
            }
        } else if (req.params.position == "backstage" || authenticated(req)) {
            if (req.body.pass == data.people.backstagepass) {
                delete data.people.backstage;
                delete data.people.backstagepass;
            } else {
                throw "Incorrect Passcode";
            }
        }
        fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(data));
        if ('waitlist' in data.people) {
            checkwaitlist(req.params.eventId, req.params.position);
        }
        res.redirect(`/events/${req.params.eventId}`);
    } catch (e) {
        res.render('error', { error: e });
    }
};
function connecttodb(callback) {
    let db = new sqlite3.Database('./user.db', (err) => {
        if (err) {
            console.error(err.message);
        }
        console.log('Connected to the login database.');
    });
    db.run('CREATE TABLE IF NOT EXISTS user(name text, password int)')
    return db;
    callback();
}
//page that has a list of events
app.get('*',  (req, res) => {
    res.status(404);
    res.redirect('/');
});

app.listen(port,  () => { //START WEBSERVER
    console.log(`The server has started on ${port}`);
    generate();
})