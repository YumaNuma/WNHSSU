const express = require("express");
var app = express();
var port = 3000 || process.env.port;
var filedir;
const path = require("path")
const fs = require("fs");
const replace = require("replace-in-file");
var nf;
var bodyParser = require("body-parser");
var ide, name, month, date, time, pn;
var options;
var eventlist = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set('views', __dirname + '/views');
app.set('view engine', 'pug')

app.post("/events/addnew", function(req, res) {
    ide = req.query.ide;
    name = req.query.name;
    month = req.query.month;
    day = req.query.day;
    time = req.query.time;
    pn = req.query.pn;
    nf = __dirname + "/events/" + ide + ".json";
    console.log(ide + " " + name + " " + month + " " + day + " " + time + " " + pn);
    try {
        if(!fs.existsSync(nf)) {
            fs.copyFileSync(__dirname + "/events/template.json", nf);
            replaceall(nf, "templateevent", name);
            replaceall(nf, "monthi", month);
            replaceall(nf, "dayi", day);
            replaceall(nf, "timei", time);
            replaceall(nf, "posi", pn);
            addtofile(name);
            res.send("Request successful");
        } else {
            throw "not success";
        }
    } catch(e) {
        console.log(e);
        res.send("Request unsuccessful");
    }
    res.end();
})
function addtofile(name1) {
    var result = JSON.parse(fs.readFileSync(__dirname + "/events/eventlist.json"));
    result.events.push({ "id": ide, "name": name })
    fs.writeFileSync(__dirname + "/events/eventlist.json", JSON.stringify(result));
    console.log(result);
}
function replaceall(a, b, c) {
    options = {
        "files": a,
        "from": b,
        "to": c
    }
    replace.sync(options);
}

app.get('/events/:eventId', function(req, res) {
    filedir =  __dirname + `/events/${req.params.eventId}.json`;
    res.json(JSON.parse(fs.readFileSync(filedir)));
})

app.get("/", function(req, res) {
    res.render("index.pug",)
})

app.listen(port, function() {
    console.log(`PORT ${port}`);
})