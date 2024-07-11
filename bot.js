const mineflayer = require('mineflayer');
const { ProxyAgent } = require('proxy-agent');
const util = require('./util');
const socks = require('socks').SocksClient;
const crypto = require('crypto');

const originalConsoleLog = console.log;
console.log = function (...args) {
    const maxLength = 200;
    const truncatedArgs = args.map(arg => {
        if (typeof arg === 'string' && arg.length > maxLength) {
            return arg.substring(0, maxLength) + '... (truncated log)';
        }
        return arg;
    });
    
    originalConsoleLog.apply(console, truncatedArgs);
};
const originalConsoleerror = console.error;
console.error = function (...args) {
    const maxLength = 500;
    const truncatedArgs = args.map(arg => {
        if (typeof arg === 'string' && arg.length > maxLength) {
            return arg.substring(0, maxLength) + '... (truncated error)';
        }
        return arg;
    });
    
    originalConsoleerror.apply(console, truncatedArgs);
};

function randomAsciiCharacter() {
    // Unicode ranges for Chinese characters
    const ranges = [
        [0x4E00, 0x9FFF],
        [0x3040, 0x309F],
        [0x30A0, 0x30FF],
        [0x1100, 0x11FF],
        [0x2000, 0x2fff]
    ];

    const range = ranges[Math.floor(Math.random() * ranges.length)];

    const randomUnicode = Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0];

    const randomChineseCharacter = String.fromCodePoint(randomUnicode);

    return randomChineseCharacter;
}

class Bot {
    constructor(username, target) {
        this.target = target;
        // this.username = "Zypr_"+username;
        this.username = username;
        this.targethost = target.split(":")[0];
        this.targetport = target.split(":")[1];
        this.password = null;
        this.bot = null;
        this.lastspam = 0;
        this.spamming = false;
        this.spamdelaymin = 0;
        this.spamdelaymax = 0;
        this.spammessage = "";
        this.registerstate = 0;
        this.loginstate = 0;
        this.stopped = false;
        this.registeredAt = null;
        this.proxy = null;
        this.success = false;
        this.mode = "normal";
        this.version = "1.19.4";
        this.onlineState = false;
        this.init()
    }
    async init() {
        var hashPwd = crypto.createHash('sha1').update(this.username).digest('hex').substring(0, 8);
        this.password = await hashPwd+"!@#";
        // this.password = "nigger12345"
    }
    isOnline() {
        return this.onlineState
    }
    async join(changeProxy = true) {
        if (this.proxy) {
            if (this.proxy != null) {
                util.removeUsing(this.proxy)
            }
        }
        try {
            this.bot.quit()
        } catch (err) {
            
        }
        try {
            delete this.bot;
        } catch (err) {

        }

        try {
            
            if (this.stopped) {
                return;
            }
            // console.log(`[${this.username}] Joining`)
            var poxi = null;
            if (changeProxy == true) {
                poxi = util.getProxi().replace("\r", "").replace("\n", "");
                this.proxy = poxi;
                console.log(`[${this.username}] Joining with proxy hop. (${poxi})`)
            } else {
                console.log(`[${this.username}] Joining without proxy hop.`)
                poxi = this.proxy;
            }
            util.addUsing(this.proxy)
            var protocol = poxi.split("://")[0] + "://";
            var protocolNumber = parseInt(protocol.replace("socks", ""));
            poxi = poxi.replace(protocol, "");

    
            if(poxi.includes("@")) {
                var proxee = poxi.split('@')
                this.bot = mineflayer.createBot({
                    host: this.targethost,
                    port: this.targetport,
                    username: this.username,
                    version: this.version,
                    hideErrors: true,
                    logError: false,
                    agent: new ProxyAgent({ protocol: protocol, host: poxi.split(':')[0], port: parseInt(poxi.split(':')[1]), username: null, password: null }),
                        connect: (client) => {
                            socks.createConnection({
                            proxy: {
                                host: proxee[1].split(':')[0],
                                port: parseInt(proxee[1].split(':')[1]),
                                type: protocolNumber,
                                
                                userId: proxee[0].split(':')[0],
                                password: proxee[0].split(':')[1]
                            },
                            command: 'connect',
                            destination: {
                                host: this.target.split(':')[0],
                                port: parseInt(this.target.split(':')[1])
                            }
                            }, (err, info) => {
                            if (err) {
                                console.log(`[${this.username}] Proxy connection failed: ${err}, hopping proxies.`)
                                util.badProxy(this.proxy)
                                try {
                                    this.join(true)
                                } catch(err) {
                                    console.error("ERR 6: " + err)
                                }
                                return
                            }
                            client.setSocket(info.socket)
                            client.emit('connect')
                        })
                    }
                })
                
            } else {
                this.bot = mineflayer.createBot({
                    host: this.targethost,
                    port: this.targetport,
                    username: this.username,
                    version: this.version,
                    hideErrors: true,
                    logError: false,
                    agent: new ProxyAgent({ protocol: protocol, host: poxi.split(':')[0], port: parseInt(poxi.split(':')[1]), username: null, password: null }),
                        connect: (client) => {
                            socks.createConnection({
                            proxy: {
                                host: poxi.split(':')[0],
                                port: parseInt(poxi.split(':')[1]),
                                type: protocolNumber,
                            },
                            command: 'connect',
                            destination: {
                                host: this.target.split(':')[0],
                                port: parseInt(this.target.split(':')[1])
                            }
                            }, (err, info) => {
                            if (err) {
                                console.log(`[${this.username}] Proxy connection failed: ${err}, hopping proxies.`)
                                util.badProxy(this.proxy)
                                try {
                                    this.join(true)
                                } catch(err) {
                                    console.error("ERR 5: " + err)
                                }
                                
                                return
                            }
                            client.setSocket(info.socket)
                            client.emit('connect')
                        })
                    }
                })
            }
            
            //this.bot._client.on("map", async ({ data }) => {
              //  this.onlineState = true;
                //const maps = this.bot.inventory.items().filter(item => item.name.includes('map'));
                //if (maps.length > 0) {
                  //  console.log(`[${this.username}] Solving image captcha`)
                    //const resultPath = await util.generateMapImage(data);
                    //const answer = await util.solveMapCaptcha(resultPath);
                    //console.log(`[${this.username}] Image Captcha Result: ${answer}`)
                    //try {
                      //  this.bot.chat(answer)
                    //} catch (e) {

                    //}
                    
                //}
                
            //})
    
            this.bot.on('physicsTick', async () => {
                this.onlineState = true;
                try {
                    if (this.bot) {
                        var chickentime = 4;
                        if (this.registeredAt == null || (new Date() - this.registeredAt < chickentime)) {
                            var yaw = util.getRandomNumber(0, 360);
                            var pitch = util.getRandomNumber(-10, 10);
                            // if (this.bot.look) {
                            //     this.bot.look(yaw, pitch, true);
                            // }
                            if (this.bot.setControlState) {
                                this.bot.setControlState("forward", true)
                            }
                        } else {
                            if (this.bot.setControlState) {
                                this.bot.setControlState("forward", false)
                            }
                            if (!(new Date() - this.registeredAt < chickentime)) {
                                // onChickenStop();
                            }
                        }
                        

                        if (this.spamming) {
                            if (this.success) {
                                var now = Date.now();
                                if (now - this.lastspam > (util.getRandomNumber(this.spamdelaymin, this.spamdelaymax))) {
                                    this.lastspam = now;
                                    var msg = this.spammessage; //randomAsciiCharacter()
                                    while (msg.includes("$r")) {
                                        msg = msg.replace("$r", await util.randomString(2))
                                    }
                                    this.bot.chat(msg)
                                }
                            }                         
                        }
                    }
                } catch (err) {
                    console.error("ERR 4: " + err)
                }
                
            })
            this.bot.on('messagestr', async (message) => {
                this.onlineState = true;
                // console.log(`[${this.username}] Message: ${message}`)
                
                if (this.registerstate == 0) {
                    const res = await util.isRegisterPrompt(message);
                    if (res) {
                        this.registerstate = 1;
                        console.log(`[${this.username}] Registering`)
                        setTimeout(() => {
                            try {
                                var chat = "/register " + this.password + " " + this.password;
                                this.bot.chat(chat);
                                this.registerstate = 2;
                                this.registeredAt = new Date();
                                console.log(`[${this.username}] Registered: ${this.password}`)
                                this.success = true
                                // onSuccess();
                            } catch (err) {
                                console.log("REGISTER ERROR: " + err)
                            }
                        }, util.getRandomNumber(6000, 7000));
                    }
                    return;
                }
                if (this.loginstate == 0) {
                    const res = await util.isLoginPrompt(message);
                    if (res) {
                        this.loginstate = 1;
                        setTimeout(() => {
                            try {
                                var chat = "/login " + this.password + " " + this.password;
                                console.log(chat)
                                this.bot.chat(chat);
                                this.loginstate = 2;
                                this.registeredAt = new Date();
                                this.success = true
                                // onSuccess();
                            } catch (err) {
                                console.log("REGISTER ERROR: " + err)
                            }
                            
                        }, util.getRandomNumber(6000, 7000));
                    }
                }
            })


            this.bot.once('spawn', async () => {
                this.registerstate = 1;
                console.log(`[${this.username}] Registering`)
                setTimeout(() => {
                    try {
                        var chat = "/register " + this.password + " " + this.password;
                        this.bot.chat(chat);
                        this.registerstate = 2;
                        this.registeredAt = new Date();
                        console.log(`[${this.username}] Registered: ${this.password}`)
                        this.success = true
                        // onSuccess();
                    } catch (err) {
                        console.log("REGISTER ERROR: " + err)
                    }
                }, util.getRandomNumber(6000, 7000));
            })

            this.bot.on('title', async (message) => {
                this.onlineState = true;
                if (this.registerstate == 0) {
                    const res = await util.isRegisterPrompt(message);
                    if (res) {
                        this.registerstate = 1;
                        console.log(`[${this.username}] Registering`)
                        setTimeout(() => {
                            try {
                                var chat = "/register " + this.password + " " + this.password;
                                this.bot.chat(chat);
                                this.registerstate = 2;
                                this.registeredAt = new Date();
                                console.log(`[${this.username}] Registered: ${this.password}`)
                                this.success = true
                                // onSuccess();
                            } catch (err) {
                                console.log("REGISTER ERROR: " + err)
                            }
                        }, util.getRandomNumber(6000, 7000));
                    }
                    return;
                }
                if (this.loginstate == 0) {
                    const res = await util.isLoginPrompt(message);
                    if (res) {
                        this.loginstate = 1;
                        setTimeout(() => {
                            try {
                                var chat = "/login " + this.password + " " + this.password;
                                console.log(chat)
                                this.bot.chat(chat);
                                this.loginstate = 2;
                                this.registeredAt = new Date();
                                this.success = true
                                // onSuccess();
                            } catch (err) {
                                console.log("REGISTER ERROR: " + err)
                            }
                            
                        }, util.getRandomNumber(6000, 7000));
                    }
                }
            })
    
            this.bot.on('kicked', async (reason, loggedIn) => {
                this.onlineState = false;
                this.success = false
                console.log(`[${this.username}] Kicked: ${reason} ${loggedIn}`)
                if (this.mode == "normal") {
                    if (util.isBotsentry(reason)) {
                        if (util.shouldRetry(this.username)) {
                            util.addRetryCount(this.username)
                            console.log(`[${this.username}] Botsentry Detected, solving... (${this.proxy})`)
        
                            const res = await util.solveBotsentry(this.proxy)
                            if (res == true) {
                                console.log(`[${this.username}] Botsentry hopefully solved!`)
                                
                                setTimeout(() => {
                                    this.join(false)
                                }, util.getRandomNumber(2000, 4000)*2)
                            } else {
                                if (util.isIPInVerificationList(this.proxy)) {
                                    console.log(`[${this.username}] Botsentry solving for this proxy is pending!`)
                                }
                                var rejoiner = setInterval(() => {
                                    if (!util.isIPInVerificationList(this.proxy)) {
                                        clearInterval(rejoiner)
                                        setTimeout(() => {
                                            this.join(false)
                                        }, util.getRandomNumber(2000, 4000)*2)
                                    }
                                }, 500)
                            }
                        } else {
                            console.log(`[${this.username}] Botsentry too many retries, switching proxy...`)
                            util.resetRetryCount(this.username)
                            setTimeout(() => {
                                this.join(true)   
                            }, util.getRandomNumber(2000, 4000))
                        }
                    } else if (util.isNAntibot(reason)) { 
                        const code = util.nAntibotFindCode(JSON.parse(reason))
                        console.log(`[${this.username}] NAntibot Detected, solving... (${code})`)
                        const res = await util.solveNAntibot(code, this.username)
                        if (res == true){
                            console.log(`[${this.username}] NAntibot hopefully solved!`)
                            
                            setTimeout(() => {
                                this.join(false)
                            }, util.getRandomNumber(2000, 4000)*2)
                        }

                    } else {
                        if (util.isRejoinRequest(reason)) {
                            setTimeout(() => {
                                this.join(false)   
                            }, util.getRandomNumber(2000, 4000))
                        } else {
                            if (util.isIPBan(reason)) {
                                util.badProxy(this.proxy)
                            }
                            
                            setTimeout(() => {
                                this.join()   
                            }, util.getRandomNumber(2000, 4000))
                            
                        }
                        
                    }
                    
                }  else {
                    setTimeout(() => {
                        this.join()   
                    }, util.getRandomNumber(2000, 4000))
                }
                
                
                
            });
            this.bot.on('error', function(err) {
                this.onlineState = false;
                setTimeout(() => {
                    try {
                        console.log(`[${this.username}] Connection failed: ${err.substring(0,20)}, hopping proxies.`)
                        util.badProxy(this.proxy)
                        try {
                            this.join(true)
                        } catch(err) {
                            console.error("ERR 3: " + err)
                        }
                    } catch (err) {
                        console.error("ERR 3.5: " + err)
                    }
                    
                }, util.getRandomNumber(2000, 4000))
            })
        } catch (err) {
            console.error("ERR 2: " + err)
        }
       
    }
    async startSpam() {
        this.spamming = true;
    }
    async stopSpam() {
        this.spamming = false;
    }
    async setSpamMessage(message) {
        this.spammessage = message;
    }
    async setSpamDelay(min, max) {
        this.spamdelaymin = min;
        this.spamdelaymax = max;
    }
    
    async quit() {
        if (this.bot) {    
            try {
                this.bot.quit();
                this.bot = null;
            } catch (err) {

            }
            
        }
    }    
}


module.exports = {Bot}