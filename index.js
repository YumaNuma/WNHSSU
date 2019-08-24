//begin of declaration of libraries
const express = require("express");//WEBSERVER LIBRARY
const replace = require("replace-in-file");//LIBRARY FOR REPLACING FILE CONTENT
const path = require("path")//LIBRARY FOR FILE DIRECTORY
var bodyParser = require("body-parser"); //PARSING POST URL QUERIES
const fs = require("fs");//FILE SYSTEM
var cookieParser = require('cookie-parser');
var helmet = require('helmet');
var request = require('request');
const sqlite3 = require('sqlite3').verbose();
var { accountSid, authToken, gcaptchac } = require('./config.json');
//end of declaration of libraries
const client = require('twilio')(accountSid, authToken);


//begin of global variables
var app = express();
var port = 80;//PORT
var filedir;//DIRECTORY OF FILE
var nf;
var ide, name, month, date, time, pn, loc; //PARAMETERS 
var options;
//end of global variables

//begin of settings for express
app.use(cookieParser());
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
app.use('/admin/*', (req, res, next) => {
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
    res.render('login');
});
//Create event page (Crew Chief Only)
//search: createevent1
app.get("/admin/createevent", (req, res) => {
    res.sendFile("/views/createevent.html", { root: __dirname });
});

app.get('/login/admin', (req, res) => {
    res.render("loginadmin", { root: __dirname });
});
app.get('/events/:eventId/delete', (req, res) => {
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

app.post('/user/logout', (req, res) => {
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

//login (Crew Chief Only)
// search: login1

//redirects to events
// search: eventredirect1
app.get("/", (req, res) => { //MAIN PAGE REDIRECT TO EVENTS
    res.redirect("/events");
});

//Delete an event
// search: delete1


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
app.post('/register', (req, res) => {
    if (!req.body.classpass == 'stage2019') {
        res.render('error', { error: "Incorrect Class Code" });
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
    checkdb(db, req, req.body.pnumber, (row1, p) => {
        try {
            if (row1 == undefined) {
                db.serialize(function () {
                    db.run('CREATE TABLE IF NOT EXISTS user(username TEXT, name TEXT, password TEXT, pnumber varchar(15))');
                    db.run('INSERT INTO user(username, name, password, pnumber) VALUES(?, ?, ?, ?)', [req.body.username, req.body.fullname, req.body.password, req.body.pnumber]);
                    db.close();
                });
                res.cookie('islogged', req.body.fullname, { maxAge: 3600000, httpOnly: true });
                res.cookie('isloggedname', req.body.username, { maxAge: 3600000, httpOnly: true });
                res.redirect(req.header('Referer') || '/');
                var pnumber = numberify(req.body.pnumber);
                client.messages
                    .create({
                        body: `Thank you ${req.body.fullname}, for creating an account on the Crew Calendar!`,
                        from: '+17162216438',
                        to: pnumber
                    });
            } else {
                throw "There is already a user with this info";
            }
        } catch (e) {
            res.render('error', { error: e })
        }
    });

});
function numberify(input) {
    return '+1' + input.toString().replace(/\s/g, '');
}
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
                    fdata.people.sound = fname;
                    fdata.people.soundpass = fpass;
                    searchuser("username", fpass, function (r) {
                       pnum = numberify(r.pnumber);
                        client.messages
                            .create({
                                body: `${r.name}, you have been signed up for the Sound Position of ${fdata.name}, on ${fdata.date.month} ${fdata.date.day}! Mark your calendar!`,
                                from: '+17162216438',
                                to: pnum
                            });
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
                        fdata.people.lights = fname;
                        fdata.people.lightpass = fpass;
                        searchuser("username", fpass, function (r) {
                            pnum = numberify(r.pnumber);
                            client.messages
                                .create({
                                    body: `${r.name}, you have been signed up for the Light Position of ${fdata.name}, on ${fdata.date.month} ${fdata.date.day}! Mark your calendar!`,
                                    from: '+17162216438',
                                    to: pnum
                                });
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
                        fdata.people.backstage = fname;
                        fdata.people.backstagepass = fpass;
                        searchuser("username", fpass, function (r) {
                            console.log("ye: " + r.pnumber + " r: " + r);
                            pnum = numberify(r.pnumber);
                            client.messages
                                .create({
                                    body: `${r.name}, you have been signed up for the Backstage Position of ${fdata.name}, on ${fdata.date.month} ${fdata.date.day}! Mark your calendar!`,
                                    from: '+17162216438',
                                    to: pnum
                                });
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

var authenticated = (r) => {
    if (r.cookies.auth == undefined || r.cookies.auth == null) {
        return false
    } else if (r.cookies.auth == "authenticated") {
        return true;
    }
};

var addtowaitlist = (req, res, n, p) => {
    var path = __dirname + `/events/${req.params.eventId}.json`;
    var data = JSON.parse(fs.readFileSync(path));
    var position = req.body.pos;
    if (!('waitlist' in data.people)) {
        data.people.waitlist = {};
    }
    if (position == 1) {
        if (!(n == data.people.sound || n == data.people.lights || n == data.people.backstage)) {
            if (!('sound' in data.people.waitlist)) {
                data.people.waitlist.sound = [];
            }
            data.people.waitlist.sound.push({ "name": n, "pass": p });
        } else {
            throw "You are already in a position!";
        }
    } else if (position == 2) {
        if (!(n == data.people.sound || n == data.people.lights || n == data.people.backstage)) {
            if (!('lights' in data.people.waitlist)) {
                data.people.waitlist.lights = [];
            }
            data.people.waitlist.lights.push({ "name": n, "pass": p });
        } else {
            throw "You are already in a position!";
        }
    } else if (position == 3) {
        if (!(n == data.people.sound || n == data.people.lights || n == data.people.backstage)) {
            if (!('backstage' in data.people.waitlist)) {
                data.people.waitlist.backstage = [];
            }
            data.people.waitlist.backstage.push({ "name": n, "pass": p });
        } else {
            throw "You are already in a position!";
        }
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
        console.log("Log created");
    }
};
var checkwaitlist = (a, p) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${a}.json`));
    if (p == "sound") {
        if (data.people.waitlist.sound.length > 1) {
            var temp = data.people.waitlist.sound[0];
            data.people.sound = temp.name;
            data.people.soundpass = temp.pass;
            data.people.waitlist.sound.shift();
        } else if (data.people.waitlist.sound.length === 1) {
            var temp = data.people.waitlist.sound[0];
            data.people.sound = temp.name;
            data.people.soundpass = temp.pass;
            delete data.people.waitlist.sound;
        }
    } else if (p == "lights") {
        if (data.people.waitlist.lights.length > 1) {
            var temp = data.people.waitlist.lights[0];
            data.people.lights = temp.name;
            data.people.lightpass = temp.pass;
            data.people.waitlist.lights.shift();
        } else if (data.people.waitlist.lights.length === 1) {
            var temp = data.people.waitlist.lights[0];
            data.people.lights = temp.name;
            data.people.lightpass = temp.pass;
            delete data.people.waitlist.lights;
        }
    } else if (p == "backstage") {
        if (data.people.waitlist.backstage.length > 1) {
            var temp = data.people.waitlist.backstage[0];
            data.people.backstage = temp.name;
            data.people.backstagepass = temp.pass;
            data.people.waitlist.backstage.shift();
        } else if (data.people.waitlist.backstage.length === 1) {
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

function checkdb(db1, req, pnumber, callback) {
    db1.serialize(function () {
        db1.get("SELECT DISTINCT * FROM user WHERE username=? OR pnumber=?", [req.body.username, req.body.pnumber], function (error, row) {
            row = JSON.stringify(row);
            callback(row, pnumber);
        });
    });
};

function searchuser(searchm, search, callback) {
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

var unsignup = (req, res) => {
    var data = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
    try {
        if (!req.cookies.islogged || !req.cookies.isloggedname || !req.cookies.auth ) {
            throw "YOU ARE NOT LOGGED IN";
        }
        if (req.params.position == "sound") {
            if (req.cookies.isloggedname == data.people.soundpass || authenticated(req)) {
                delete data.people.sound;
                delete data.people.soundpass;
                searchuser('username', req.cookies.isloggedname, function (r) {
                    pnum = numberify(r.pnumber);
                    client.messages
                        .create({
                            body: `${r.name}, you have been unsigned up for the Sound Position of ${data.name}`,
                            from: '+17162216438',
                            to: pnum
                        });
                })
            } else {
                throw "Incorrect Passcode";
            }
        } else if (req.params.position == "lights") {
            if (req.cookies.isloggedname == data.people.lightpass || authenticated(req)) {
                delete data.people.lights;
                delete data.people.lightpass;
                searchuser('username', req.cookies.isloggedname, function (r) {
                    pnum = numberify(r.pnumber);
                    client.messages
                        .create({
                            body: `${r.name}, you have been unsigned up for the Lights Position of ${data.name}`,
                            from: '+17162216438',
                            to: pnum
                        });
                });
            } else {
                throw "Incorrect Passcode";
            }
        } else if (req.params.position == "backstage") {
            if (req.cookies.isloggedname == data.people.backstagepass || authenticated(req)) {
                delete data.people.backstage;
                delete data.people.backstagepass;
                searchuser('username', req.cookies.isloggedname, function (r) {
                    pnum = numberify(r.pnumber);
                    client.messages
                        .create({
                            body: `${r.name}, you have been unsigned up for the Backstage Position of ${data.name}`,
                            from: '+17162216438'  ,
                            to: pnum
                        });
                })
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
function checkiflogged(r) {
    var username1 = "";
    if (r.cookies.islogged) {
        username1 = r.cookies.islogged;
    }
    return username1;
}


//page that has a list of events
app.get('*', (req, res) => {
    res.status(404);
    res.redirect('/');
});

app.listen(port, () => { //START WEBSERVER
    console.log(`The server has started on ${port}`);
    generate();
});