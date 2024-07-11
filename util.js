const axios = require('axios');
const crypto = require('crypto');
const fs = require('fs');
const { exec } = require('child_process');
const PNGImage = require('pngjs-image');

var verificationqueue = [];
var verificationscounted = {}; 
var proxiesused = {}; 
function addUsing(proxy) {
    if (proxy in proxiesused) {
        proxiesused[proxy] = proxiesused[proxy] + 1;
    } else {
        proxiesused[proxy] = 1;
    }
}
function removeUsing(proxy) {
    if (proxy in proxiesused) {
        proxiesused[proxy] = proxiesused[proxy] - 1;
    } else {
        proxiesused[proxy] = 0;
    }
}

function resetRetryCount(username) {
    verificationscounted[username] = 0;
}
function addRetryCount(username) {
    if (username in verificationscounted) {
        verificationscounted[username] = verificationscounted[username] + 1;
    } else {
        verificationscounted[username] = 1;
    }
}
function shouldRetry(username) {
    if (username in verificationscounted) {
        var val = verificationscounted[username];
        if (val > 3) {
            return false;
        }
    }
    return true;
}
function removeItemOnce(arr, value) {
    return arr.filter(item => item !== value);
}
  

function addIPToVerificationList(ip) {
    verificationqueue.push(ip)
}
function removeIPFromVerificationList(ip) {
    verificationqueue = removeItemOnce(verificationqueue, ip)
}

function isIPInVerificationList(ip) {
    return verificationqueue.includes(ip)
}

async function getRandomLine(filename) {
    return new Promise((resolve, reject) => {
    fs.readFile(filename, function(err, data) {
        if (err) reject(err);
        var lines = data.toString().split('\n');
        var randomLine = lines[Math.floor(Math.random() * lines.length)];
        resolve(randomLine);
    });
    });
}
async function solveBotsentry(proxy) {
    if (!isIPInVerificationList(proxy)) {
        addIPToVerificationList(proxy)
        let child = exec('solveBotsentry.py '+proxy);
        await new Promise( (resolve, reject) => {
            child.on('close', resolve);
        });
        removeIPFromVerificationList(proxy)
        return true;
    } else {
        return false;
    }
}

function nAntibotFindCode(jsonData) {
    const extra = jsonData.extra;
    for (let i = 0; i < extra.length; i++) {
        const item = extra[i];
        if (item.color === "aqua" && item.text.length === 5) {
            return item.text;
        }
    }
    return null;
}

async function solveNAntibot(code, username) {
    let child = exec('solveNAntibot.py ' + username + " " + code);
    await new Promise( (resolve, reject) => {
        child.on('close', resolve);
    });
    return true;
}

function isBotsentry(disconnectmsg) {
    let newmsg = disconnectmsg.toString();
    return (newmsg.includes("BOTSENTRY") || newmsg.includes("Your IP is blacklisted by the AntiBot system.") || newmsg.includes("www.notbot.es") || newmsg.includes("Do you want to play right now? Complete the Google Captcha at:"))
}

function isNAntibot(disconnectmsg) {
    let newmsg = disconnectmsg.toString();
    return (newmsg.includes("ab.nickuc.com"))
}

function isRejoinRequest(disconnectmsg) {
    let newmsg = disconnectmsg.toString();
    return (newmsg.includes("We are analyzing your connection")|| newmsg.toLowerCase().includes("join") || newmsg.toLowerCase().includes("connect") || newmsg.toLowerCase().includes("ping"))
}
function isIPBan(disconnectmsg) {
    let newmsg = disconnectmsg.toString();
    return (newmsg.includes("Your IP address is banned from this server."))
}
function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

var proxies = fs.readFileSync("oproxies.txt").toString().split("\n");

function getRandomProxy() {
    return proxies[getRandomInt(proxies.length)];
}
function getProxi() {
    while (true) {
        var theproxy = getRandomProxy();
        var usedamount = 0
        if (theproxy in proxiesused) {
            usedamount = proxiesused[theproxy]
        }
        if (usedamount < 3) {
            return theproxy
        }
    }
}
function badProxy(proxy) {
    proxies = removeItemOnce(proxies, proxy);
}


async function generateUsername_Realistic() {
    return (await getRandomLine("names.txt")).replace("\r", "")
}
async function generateUsername_Random() {
    const rand = await randomString(8)
    return rand
}

async function randomString(length) {
    const rand = crypto.randomBytes(length).toString('hex').substr(0, length);
    return rand
}
async function getServerData(serverhostname) {
    const response = await axios.get('https://api.mcsrvstat.us/2/'+serverhostname);
    const data = await response.data;
    return data;
}
async function isTCPShield(servermotd) {
    for (let i = 0; i < servermotd.length; i++) {
          motdline = servermotd[i];
        if (motdline.includes("docs.tcpshield.com") || motdline.includes("Invalid hostname.")) {
            return true
        }
    }
}
async function resolveConnectionInformation(serverhostname) {
    const data = await getServerData(serverhostname);
    const serverip = data.ip;
    const serverport = data.port;

    try {
        const dataipport = await getServerData(serverip + ":" + serverport);
        const rawmotd = dataipport.motd.clean;
        const istcpshield = await isTCPShield(rawmotd);
        if (istcpshield) {
            return serverhostname + ":" + serverport;
        } else {
            return serverip + ":" + serverport;
        }
    } catch (error) {
        return serverip + ":" + serverport;
    }
}

async function wait(ms) {
    return new Promise(function (resolve, reject) {
        setTimeout(function () {
        resolve('Promise resolved')}, ms); 
    });
}
function getRandomNumber(min, max) {
    return Math.random() * (max - min + 1) + min;
}
async function isRegisterPrompt(message) {
    // /^(\/(login|signin|log))\s+([^<>]+)\s+([^<>]+|\3)$/i
    // ^(\/(reg(ister)?|signup|sign-up|signin|sign-in))\s+([^.]+)\s+([^.]+|\3|\4)$
    return /(\/(reg(ister)?|signup|sign-up|signin|sign-in))\s+([^.]+)\s+([^.]+|\3|\4)/g.test(message) || /(\/(reg(ister)?|signup|sign-up|signin|sign-in))\s+([^.]+)/g.test(message)
}
async function isLoginPrompt(message) {
    // /^(\/(login|signin|log))\s+([^<>]+)\s+([^<>]+|\3)$/i
    // ^(\/(reg(ister)?|signup|sign-up|signin|sign-in))\s+([^.]+)\s+([^.]+|\3|\4)$
    return /(\/(login|signin|log))\s+([^<>]+)\s+([^<>]+|\3)/g.test(message)
}

function executeCommand(command) {
    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          reject(error);
        } else {
          resolve(stdout);
        }
      });
    });
  }

async function solveMapCaptcha(path) {
    var result = await executeCommand(`solveMapCaptcha.py ${path}`);
    result = result.trim();
    return result;
}

async function generateMapImage(data) {
    if (!data) return null;
  
    const size = Math.sqrt(data.length);
    const image = PNGImage.createImage(size, size);
  
    for (let x = 0; x < size; x++) {
        for (let z = 0; z < size; z++) {
            const colorId = data[x + z * size];
            image.setAt(x, z, getColor(colorId));
        }
    }
    const filepath = `maps/Map_${await randomString(16)}.png`

    const writeImageAsync = () => {
        return new Promise((resolve, reject) => {
            image.writeImage(filepath, function (err) {
                if (err) reject(err);
                else resolve(filepath);
            });
        });
    };
  
    try {
        await writeImageAsync();
        return filepath;
    } catch (err) {
        console.error('Error writing image:', err);
        return null;
    }
  }

function getColor(colorId) {

	const colors = [
		{ red: 0, green: 0, blue: 0, alpha: 255 },
		{ red: 89, green: 125, blue: 39, alpha: 255 },
		{ red: 109, green: 153, blue: 48, alpha: 255 },
		{ red: 127, green: 178, blue: 56, alpha: 255 },
		{ red: 67, green: 94, blue: 29, alpha: 255 },
		{ red: 174, green: 164, blue: 115, alpha: 255 },
		{ red: 213, green: 201, blue: 140, alpha: 255 },
		{ red: 247, green: 233, blue: 163, alpha: 255 },
		{ red: 130, green: 123, blue: 86, alpha: 255 },
		{ red: 140, green: 140, blue: 140, alpha: 255 },
		{ red: 171, green: 171, blue: 171, alpha: 255 },
		{ red: 199, green: 199, blue: 199, alpha: 255 },
		{ red: 105, green: 105, blue: 105, alpha: 255 },
		{ red: 180, green: 0, blue: 0, alpha: 255 },
		{ red: 220, green: 0, blue: 0, alpha: 255 },
		{ red: 255, green: 0, blue: 0, alpha: 255 },
		{ red: 135, green: 0, blue: 0, alpha: 255 },
		{ red: 112, green: 112, blue: 180, alpha: 255 },
		{ red: 138, green: 138, blue: 220, alpha: 255 },
		{ red: 160, green: 160, blue: 255, alpha: 255 },
		{ red: 84, green: 84, blue: 135, alpha: 255 },
		{ red: 117, green: 117, blue: 117, alpha: 255 },
		{ red: 144, green: 144, blue: 144, alpha: 255 },
		{ red: 167, green: 167, blue: 167, alpha: 255 },
		{ red: 88, green: 88, blue: 88, alpha: 255 },
		{ red: 0, green: 87, blue: 0, alpha: 255 },
		{ red: 0, green: 106, blue: 0, alpha: 255 },
		{ red: 0, green: 124, blue: 0, alpha: 255 },
		{ red: 0, green: 65, blue: 0, alpha: 255 },
		{ red: 180, green: 180, blue: 180, alpha: 255 },
		{ red: 220, green: 220, blue: 220, alpha: 255 },
		{ red: 255, green: 255, blue: 255, alpha: 255 },
		{ red: 135, green: 135, blue: 135, alpha: 255 },
		{ red: 115, green: 118, blue: 129, alpha: 255 },
		{ red: 141, green: 144, blue: 158, alpha: 255 },
		{ red: 164, green: 168, blue: 184, alpha: 255 },
		{ red: 86, green: 88, blue: 97, alpha: 255 },
		{ red: 106, green: 76, blue: 54, alpha: 255 },
		{ red: 130, green: 94, blue: 66, alpha: 255 },
		{ red: 151, green: 109, blue: 77, alpha: 255 },
		{ red: 79, green: 57, blue: 40, alpha: 255 },
		{ red: 79, green: 79, blue: 79, alpha: 255 },
		{ red: 96, green: 96, blue: 96, alpha: 255 },
		{ red: 112, green: 112, blue: 112, alpha: 255 },
		{ red: 59, green: 59, blue: 59, alpha: 255 },
		{ red: 45, green: 45, blue: 180, alpha: 255 },
		{ red: 55, green: 55, blue: 220, alpha: 255 },
		{ red: 64, green: 64, blue: 255, alpha: 255 },
		{ red: 33, green: 33, blue: 135, alpha: 255 },
		{ red: 100, green: 84, blue: 50, alpha: 255 },
		{ red: 123, green: 102, blue: 62, alpha: 255 },
		{ red: 143, green: 119, blue: 72, alpha: 255 },
		{ red: 75, green: 63, blue: 38, alpha: 255 },
		{ red: 180, green: 177, blue: 172, alpha: 255 },
		{ red: 220, green: 217, blue: 211, alpha: 255 },
		{ red: 255, green: 252, blue: 245, alpha: 255 },
		{ red: 135, green: 133, blue: 129, alpha: 255 },
		{ red: 152, green: 89, blue: 36, alpha: 255 },
		{ red: 186, green: 109, blue: 44, alpha: 255 },
		{ red: 216, green: 127, blue: 51, alpha: 255 },
		{ red: 114, green: 67, blue: 27, alpha: 255 },
		{ red: 125, green: 53, blue: 152, alpha: 255 },
		{ red: 153, green: 65, blue: 186, alpha: 255 },
		{ red: 178, green: 76, blue: 216, alpha: 255 },
		{ red: 94, green: 40, blue: 114, alpha: 255 },
		{ red: 72, green: 108, blue: 152, alpha: 255 },
		{ red: 88, green: 132, blue: 186, alpha: 255 },
		{ red: 102, green: 153, blue: 216, alpha: 255 },
		{ red: 54, green: 81, blue: 114, alpha: 255 },
		{ red: 161, green: 161, blue: 36, alpha: 255 },
		{ red: 197, green: 197, blue: 44, alpha: 255 },
		{ red: 229, green: 229, blue: 51, alpha: 255 },
		{ red: 121, green: 121, blue: 27, alpha: 255 },
		{ red: 89, green: 144, blue: 17, alpha: 255 },
		{ red: 109, green: 176, blue: 21, alpha: 255 },
		{ red: 127, green: 204, blue: 25, alpha: 255 },
		{ red: 67, green: 108, blue: 13, alpha: 255 },
		{ red: 170, green: 89, blue: 116, alpha: 255 },
		{ red: 208, green: 109, blue: 142, alpha: 255 },
		{ red: 242, green: 127, blue: 165, alpha: 255 },
		{ red: 128, green: 67, blue: 87, alpha: 255 },
		{ red: 53, green: 53, blue: 53, alpha: 255 },
		{ red: 65, green: 65, blue: 65, alpha: 255 },
		{ red: 76, green: 76, blue: 76, alpha: 255 },
		{ red: 40, green: 40, blue: 40, alpha: 255 },
		{ red: 108, green: 108, blue: 108, alpha: 255 },
		{ red: 132, green: 132, blue: 132, alpha: 255 },
		{ red: 153, green: 153, blue: 153, alpha: 255 },
		{ red: 81, green: 81, blue: 81, alpha: 255 },
		{ red: 53, green: 89, blue: 108, alpha: 255 },
		{ red: 65, green: 109, blue: 132, alpha: 255 },
		{ red: 76, green: 127, blue: 153, alpha: 255 },
		{ red: 40, green: 67, blue: 81, alpha: 255 },
		{ red: 89, green: 44, blue: 125, alpha: 255 },
		{ red: 109, green: 54, blue: 153, alpha: 255 },
		{ red: 127, green: 63, blue: 178, alpha: 255 },
		{ red: 67, green: 33, blue: 94, alpha: 255 },
		{ red: 36, green: 53, blue: 125, alpha: 255 },
		{ red: 44, green: 65, blue: 153, alpha: 255 },
		{ red: 51, green: 76, blue: 178, alpha: 255 },
		{ red: 27, green: 40, blue: 94, alpha: 255 },
		{ red: 72, green: 53, blue: 36, alpha: 255 },
		{ red: 88, green: 65, blue: 44, alpha: 255 },
		{ red: 102, green: 76, blue: 51, alpha: 255 },
		{ red: 54, green: 40, blue: 27, alpha: 255 },
		{ red: 72, green: 89, blue: 36, alpha: 255 },
		{ red: 88, green: 109, blue: 44, alpha: 255 },
		{ red: 102, green: 127, blue: 51, alpha: 255 },
		{ red: 54, green: 67, blue: 27, alpha: 255 },
		{ red: 108, green: 36, blue: 36, alpha: 255 },
		{ red: 132, green: 44, blue: 44, alpha: 255 },
		{ red: 153, green: 51, blue: 51, alpha: 255 },
		{ red: 81, green: 27, blue: 27, alpha: 255 },
		{ red: 17, green: 17, blue: 17, alpha: 255 },
		{ red: 21, green: 21, blue: 21, alpha: 255 },
		{ red: 25, green: 25, blue: 25, alpha: 255 },
		{ red: 13, green: 13, blue: 13, alpha: 255 },
		{ red: 176, green: 168, blue: 54, alpha: 255 },
		{ red: 215, green: 205, blue: 66, alpha: 255 },
		{ red: 250, green: 238, blue: 77, alpha: 255 },
		{ red: 132, green: 126, blue: 40, alpha: 255 },
		{ red: 64, green: 154, blue: 150, alpha: 255 },
		{ red: 79, green: 188, blue: 183, alpha: 255 },
		{ red: 92, green: 219, blue: 213, alpha: 255 },
		{ red: 48, green: 115, blue: 112, alpha: 255 },
		{ red: 52, green: 90, blue: 180, alpha: 255 },
		{ red: 63, green: 110, blue: 220, alpha: 255 },
		{ red: 74, green: 128, blue: 255, alpha: 255 },
		{ red: 39, green: 67, blue: 135, alpha: 255 },
		{ red: 0, green: 153, blue: 40, alpha: 255 },
		{ red: 0, green: 187, blue: 50, alpha: 255 },
		{ red: 0, green: 217, blue: 58, alpha: 255 },
		{ red: 0, green: 114, blue: 30, alpha: 255 },
		{ red: 91, green: 60, blue: 34, alpha: 255 },
		{ red: 111, green: 74, blue: 42, alpha: 255 },
		{ red: 129, green: 86, blue: 49, alpha: 255 },
		{ red: 68, green: 45, blue: 25, alpha: 255 },
		{ red: 79, green: 1, blue: 0, alpha: 255 },
		{ red: 96, green: 1, blue: 0, alpha: 255 },
		{ red: 112, green: 2, blue: 0, alpha: 255 },
		{ red: 59, green: 1, blue: 0, alpha: 255 },
		{ red: 147, green: 124, blue: 113, alpha: 255 },
		{ red: 180, green: 152, blue: 138, alpha: 255 },
		{ red: 209, green: 177, blue: 161, alpha: 255 },
		{ red: 110, green: 93, blue: 85, alpha: 255 },
		{ red: 112, green: 57, blue: 25, alpha: 255 },
		{ red: 137, green: 70, blue: 31, alpha: 255 },
		{ red: 159, green: 82, blue: 36, alpha: 255 },
		{ red: 84, green: 43, blue: 19, alpha: 255 },
		{ red: 105, green: 61, blue: 76, alpha: 255 },
		{ red: 128, green: 75, blue: 93, alpha: 255 },
		{ red: 149, green: 87, blue: 108, alpha: 255 },
		{ red: 78, green: 46, blue: 57, alpha: 255 },
		{ red: 79, green: 76, blue: 97, alpha: 255 },
		{ red: 96, green: 93, blue: 119, alpha: 255 },
		{ red: 112, green: 108, blue: 138, alpha: 255 },
		{ red: 59, green: 57, blue: 73, alpha: 255 },
		{ red: 131, green: 93, blue: 25, alpha: 255 },
		{ red: 160, green: 114, blue: 31, alpha: 255 },
		{ red: 186, green: 133, blue: 36, alpha: 255 },
		{ red: 98, green: 70, blue: 19, alpha: 255 },
		{ red: 72, green: 82, blue: 37, alpha: 255 },
		{ red: 88, green: 100, blue: 45, alpha: 255 },
		{ red: 103, green: 117, blue: 53, alpha: 255 },
		{ red: 54, green: 61, blue: 28, alpha: 255 },
		{ red: 112, green: 54, blue: 55, alpha: 255 },
		{ red: 138, green: 66, blue: 67, alpha: 255 },
		{ red: 160, green: 77, blue: 78, alpha: 255 },
		{ red: 84, green: 40, blue: 41, alpha: 255 },
		{ red: 40, green: 28, blue: 24, alpha: 255 },
		{ red: 49, green: 35, blue: 30, alpha: 255 },
		{ red: 57, green: 41, blue: 35, alpha: 255 },
		{ red: 30, green: 21, blue: 18, alpha: 255 },
		{ red: 95, green: 75, blue: 69, alpha: 255 },
		{ red: 116, green: 92, blue: 84, alpha: 255 },
		{ red: 135, green: 107, blue: 98, alpha: 255 },
		{ red: 71, green: 56, blue: 51, alpha: 255 },
		{ red: 61, green: 64, blue: 64, alpha: 255 },
		{ red: 75, green: 79, blue: 79, alpha: 255 },
		{ red: 87, green: 92, blue: 92, alpha: 255 },
		{ red: 46, green: 48, blue: 48, alpha: 255 },
		{ red: 86, green: 51, blue: 62, alpha: 255 },
		{ red: 105, green: 62, blue: 75, alpha: 255 },
		{ red: 122, green: 73, blue: 88, alpha: 255 },
		{ red: 64, green: 38, blue: 46, alpha: 255 },
		{ red: 53, green: 43, blue: 64, alpha: 255 },
		{ red: 65, green: 53, blue: 79, alpha: 255 },
		{ red: 76, green: 62, blue: 92, alpha: 255 },
		{ red: 40, green: 32, blue: 48, alpha: 255 },
		{ red: 53, green: 35, blue: 24, alpha: 255 },
		{ red: 65, green: 43, blue: 30, alpha: 255 },
		{ red: 76, green: 50, blue: 35, alpha: 255 },
		{ red: 40, green: 26, blue: 18, alpha: 255 },
		{ red: 53, green: 57, blue: 29, alpha: 255 },
		{ red: 65, green: 70, blue: 36, alpha: 255 },
		{ red: 76, green: 82, blue: 42, alpha: 255 },
		{ red: 40, green: 43, blue: 22, alpha: 255 }
	]

	colorId -= 3

	if(!colors[colorId]) return { red:255, green: 255, blue: 255, alpha: 255 }
	else return colors[colorId];

}

module.exports = {solveMapCaptcha, generateMapImage, nAntibotFindCode, addUsing, removeUsing, isIPBan, badProxy, isRejoinRequest, resetRetryCount, shouldRetry, addRetryCount, wait, isIPInVerificationList, addIPToVerificationList, removeIPFromVerificationList, isBotsentry, isNAntibot,getProxi, getServerData, isTCPShield, resolveConnectionInformation, randomString, getRandomLine, generateUsername_Random, generateUsername_Realistic, getRandomNumber, isRegisterPrompt, isLoginPrompt, solveBotsentry, solveNAntibot};
