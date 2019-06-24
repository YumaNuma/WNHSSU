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
var port = 3000 || process.env.port;//PORT
var filedir;//DIRECTORY OF FILE
var nf;
var ide, name, month, date, time, pn; //PARAMETERS 
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
            if (pn = 1) {
                replaceall(nf, "posi", "Sound Only");
            } else if (pn = 2) {
                replaceall(nf, "posi", "Sound & Lights");
            } else if (pn = 3) {
                replaceall(nf, "posi", "Sound & Lights & Backstage");
            } else {
                throw "INVALID POSITION"
            }
            // end
            addtofile(ide, name); //add to event list 
            res.json(JSON.parse(nf)); //result send back json file
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
    if (!fs.existsSync(__dirname + "/events/eventlist.json")) {
        fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify({ "events": [] }))
    }
    var result = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    result.events.push({ "id": id1, "name": name1 })
    fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify(result));
    console.log(result);
}
function replaceall(a, b, c) { //CHANGE CONTENT OF NEW JSON FILE
    options = {
        "files": a,
        "from": b,
        "to": c
    }
    replace.sync(options);
}

app.get('/events/:eventId', function(req, res) { // RETRIEVE DATA OF EVENT
    filedir =  __dirname + `/events/${req.params.eventId}.json`;
    res.json(JSON.parse(fs.readFileSync(filedir)));
})

app.get("/", function(req, res) { //MAIN PAGE REDIRECT TO EVENTS
    res.redirect("/events");
})
app.get("/events", function (req, res) { //LIST OF EVENTS
    
})
app.listen(port, function() { //START WEBSERVER
    console.log(`PORT ${port}`);
})