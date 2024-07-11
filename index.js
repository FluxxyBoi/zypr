const express = require("express");
const bodyParser = require('body-parser');
const app = express();
const attack = require("./attack.js");
app.use(bodyParser.json());
const port = 3000;
const util = require("./util.js");

app.post("/startspam", async function (req, res) {
    const data = req.body
    const id = data.id;
    const message = data.message;
    const spamdelaymin = data.spamdelaymin
    const spamdelaymax = data.spamdelaymax
    attack.setSpamMessage(id, message)
    attack.setSpamDelay(id, spamdelaymin, spamdelaymax)
    attack.startSpam(id)
    res.send({"status": "ok"})
});

app.post('/stopspam', async function (req, res) {
    const data = req.body
    const id = data.id;
    attack.stopSpam(id)
    res.send({"status": "ok"})
});

app.post("/stopattack", async function (req, res) {
    const data = req.body
    const id = data.id;
    attack.stopAttack(id)
    res.send({"status": "ok"})
});

app.post("/online", async function (req, res) {
    const data = req.body
    const id = data.id;
    const onlinebots = attack.getOnlineBots(id);
    const amountOfOnlinebots = onlinebots.length;
    res.send({"status": "ok", "bots": amountOfOnlinebots, "names": onlinebots})
});

app.post("/startattack", async function (req, res) {
    const data = req.body
    let target = data.target
    const bots = data.bots
    const joindelaymin = data.joindelaymin
    const joindelaymax = data.joindelaymax
    const usernamemode = data.usernamemode
    const waitforothers  = data.wait

    if (target == undefined) {
        res.send({"error": "Missing target"})
    }
    if (bots == undefined) {
        res.send({"error": "Missing bots"})
    }
    if (joindelaymin == undefined) {
        res.send({"error": "Missing joindelaymin"})
    }
    if (joindelaymax == undefined) {
        res.send({"error": "Missing joindelaymax"})
    }
    if (usernamemode == undefined) {
        res.send({"error": "Missing usernamemode"})
    }
    if (waitforothers == undefined) {
        res.send({"error": "Missing wait"})
    }
    
    let info = null;
    if (!target.includes(":")) {
        info = await util.resolveConnectionInformation(target);
        target = info;
    } else {
        info = target;
    }
    
    const attackdata = await attack.startAttack(bots, usernamemode, info, target, joindelaymin, joindelaymax, Date.now(), waitforothers)
    const attackid = attackdata.id
    res.send({"status": "ok", "id": attackid, "info": info})
});

app.listen(port, async function () {
    console.log(`Example app listening on port ${port}!`);
});