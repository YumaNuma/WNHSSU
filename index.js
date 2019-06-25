/*
/////////////////////////////////////////////////////////////
/
/           COPYRIGHT ZAID ARSHAD 2018
/           license: Attribution-NonCommercial-ShareAlike 4.0 International (CC BY-NC-SA 4.0)(https://creativecommons.org/licenses/by-nc-sa/4.0/)
/
////////////////////////////////////////////////////////////
*/


//begin of declaration of libraries
const express = require("express");//WEBSERVER LIBRARY
const replace = require("replace-in-file");//LIBRARY FOR REPLACING FILE CONTENT
const path = require("path")//LIBRARY FOR FILE DIRECTORY
var bodyParser = require("body-parser"); //PARSING POST URL QUERIES
const fs = require("fs");//FILE SYSTEM
//end of declaration of libraries

//begin of global variables
var app = express();
var port = 80 || process.env.port;//PORT
var filedir;//DIRECTORY OF FILE
var nf;
var ide, name, month, date, time, pn, loc; //PARAMETERS 
var options;
//end of global variables

//begin of settings for express
app.use(bodyParser.json()); //USE BODYPARSER
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', __dirname + '/views'); //SET THE VIEW FOLDER
app.set('view engine', 'pug'); //SET THE VIEW ENGINE
//end of settings for express


app.post("/events/addnew", function(req, res) { //MAIN POST FUNCTION - GENERATE EVENT FILE
    ide = req.query.ide; //e.g. ?id=127852
    name = req.query.name; //e.g. ?name=winterconcert
    month = req.query.month; //e.g. ?month=09
    day = req.query.day; // e.g. ?day=24
    time = req.query.time; //e.g. ?time=5:30
    loc = req.query.loca;
    pn = req.query.pn; //positions needed e.g. ?pn=1-3
    nf = __dirname + "/events/" + ide + ".json"; //FILE LOCATION
    console.log(ide + " " + name + " " + month + " " + day + " " + time + " " + pn);
    try {
        if (!fs.existsSync(nf)) {
            fs.copyFileSync(__dirname + "/events/template.json", nf);
                        //following code replaces strings in the newly made file that is identical to the template
            replaceall(nf, "templateevent", name);
            replaceall(nf, "monthi", month);
            replaceall(nf, "dayi", day);
            replaceall(nf, "timei", time);
            replaceall(nf, "loci", loc);
            replaceall(nf, "idi", ide);
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
            addtofile(ide, name); //add to event list 
            res.send("REQUEST SUCCESSFUL"); //result send back status
        } else {
            throw "FILE EXISTS";
        }
    } catch(e) {
        console.log(e);
        res.send("Request unsuccessful. \n Error Log: " + e);
    } 

    res.end(); 
})
function addtofile(id1, name1) { //ADD TO ARRAY OF EVENTLIST JSON
    makeel();
    var result = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    result.events.unshift({ "id": id1, "name": name1 })
    fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify(result));
}
function replaceall(a, b, c) { //CHANGE CONTENT OF NEW JSON FILE
    options = {
        "files": a,
        "from": b,
        "to": c
    }
    replace.sync(options);
}

function makeel() {
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    return;
}

//the event page
app.get('/events/:eventId', function(req, res) { // RETRIEVE DATA OF EVENT
    filedir = __dirname + `/events/${req.params.eventId}.json`;
    var date = new Date().getFullYear().toString();
    var datate = JSON.parse(fs.readFileSync(filedir));
    res.render("viewpage", { datai: datate, yeari: date, peoplei: datate.people })
})

//the signup for the event page
app.get('/events/:eventId/signup', function (req, res) { //signup
    var fid = req.params.eventId;
    res.render("signup", { datak: fid });
})

//the post url where the data from the event signup page goes to
app.post('/events/:eventId/setpos', function (req, res) {
    try {
        var fname = req.body.name;
        var fpos = req.body.pos;
        var fdata = JSON.parse(fs.readFileSync(__dirname + `/events/${req.params.eventId}.json`));
        if (fpos == "1") {
            if (!('sound' in fdata.people)) {
                fdata.people.sound = fname;
            } else {
                throw "lmao someone already chose that";
            }
        }
        else if (fpos == "2") {
            if (!('lights' in fdata.people)) {
                fdata.people.lights = fname;
            } else {
                throw "lmao someone already chose that";
            }
        }
        else if (fpos == "3") {
            if (!('backstage' in fdata.people)) {
                fdata.people.backstage = fname;
            } else {
                throw "lmao someone already chose that";
            }
        }
        fs.writeFileSync(__dirname + `/events/${req.params.eventId}.json`, JSON.stringify(fdata));
        res.redirect(`/events/${req.params.eventId}`);
    } catch (e) {
        res.send(e);
    }
})

//redirects to events
app.get("/", function (req, res) { //MAIN PAGE REDIRECT TO EVENTS
    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log(ip);
    res.redirect("/events");
    var ua = req.header('user-agent');
    // Check the user-agent string to identyfy the device. 
    if (/mobile|iphone|ipod|android|blackberry|opera|mini|windows\sce|palm|smartphone|iemobile|ipad|android|android 3.0|xoom|sch-i800|playbook|tablet|kindle/i.test(ua)) {
        res.sendfile(__dirname + '/mobile.html');
    } else {
        res.sendfile(__dirname + '/index.html');
    }
})

//page that has a list of events
app.get("/events", function (req, res) { //LIST OF EVENTS
    makeel();
    var el = loadevent();
    res.render("index", { els: el.events });
})

//create eent admin only
app.get("/createevent", function (req, res) {
    res.sendFile("/views/createevent.html", { root: __dirname })
})

function loadevent() {
    return JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
}
app.listen(port, function() { //START WEBSERVER
    console.log(`PORT ${port}`);
})