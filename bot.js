/**
 * Author: Baterka.xyz
 * Website: https://baterka.xyz
 * By deleting this block you prevents further development of this bot!
 */

const SteamUser = require("steam-user"),
    TradeOfferManager = require("steam-tradeoffer-manager"),
    SteamTotp = require("steam-totp"),
    SteamCommunity = require("steamcommunity"),
    config = require("./config"),
    fs = require('fs-extra'),
    stringArgv = require('string-argv');

let client = new SteamUser(),
    manager = new TradeOfferManager({
        "steam": client,
        "pollInterval": "10000",
        "cancelTime": 10 * 60 * 1000
    }),
    community = new SteamCommunity();

let annoucenment_timer = null;
let cache_filename = './announcement.json';
let cache_data = null;

client.logOn({
    accountName: config.bot_account.username,
    password: config.bot_account.password,
    twoFactorCode: SteamTotp.getAuthCode(config.bot_account.shared_secret),
    rememberPassword: true
});

if (!fs.pathExistsSync(cache_filename)) {
    fs.writeJsonSync(cache_filename, {});
    cache_data = {};
    console.log("Successfully created new cache file.");
} else {
    cache_data = fs.readJsonSync(cache_filename);
    console.log("Successfully loaded cached data: " + JSON.stringify(cache_data));

    if(JSON.stringify(cache_data) !== "{}"){
        annoucenment_timer = setInterval(async () => {
            try {
                await postAnnouncement(cache_data.title, cache_data.message);
                console.log("Next announcement in " + time + " minutes.");
            } catch (err) {
                console.log(err);
            }
        }, cache_data.time * 60 * 1000);
        console.log("Successfully enabled automatic announcement posting from cache.");
    }
}

client.on("loggedOn", () => {
    client.getPersonas([client.steamID], (personas) => {
        console.log("Logged as '" + personas[client.steamID].player_name + "' (" + client.steamID + ")");
    });
    client.setPersona(SteamUser.EPersonaState.Online, config.profile.username);
});

client.on("webSession", (sessionID, cookies) => {
    manager.setCookies(cookies, (err) => {
        if (err)
            return console.log("An error occurred while setting cookies:" + err);

        console.log("Websession created and cookies set");
        clearTimeout(restart_timer);
    });
    community.setCookies(cookies);
    community.startConfirmationChecker(10000, config.bot_account.identity_secret);
    setPlaying();
});

client.on("groupRelationship", (sender, rel) => {
    if (rel === SteamUser.EClanRelationship.Invited) {
        console.log("Invite to group '" + sender.getSteamID64() + "' automatically ignored");
        client.respondToGroupInvite(sender, false);
    }
});

client.on("friendRelationship", (sender, rel) => {
    if (rel === SteamUser.EFriendRelationship.RequestRecipient && (config.admins.indexOf(sender.toString()) >= 0))
        client.addFriend(sender);
    else if (rel === SteamUser.EFriendRelationship.Friend) {
        client.getPersonas([sender], personas => {
            steamChatMessage(sender, "Welcome my lord!");
        });
    }
});

client.on("friendMessage", async (sender, message) => {
    let steamid = sender.getSteamID64();

    let isAdmin = (config.admins.indexOf(steamid) >= 0 || config.admins.indexOf(parseInt(steamid)) >= 0);

    if (message.charAt(0) === "!") {
        let command = stringArgv.parseArgsStringToArgv(message.slice(1));

        if (command[0])
            command[0] = command[0].toUpperCase();

        switch (command[0]) {
            case "HELP": {
                if (!isAdmin)
                    steamChatMessage(sender, "I am automatizated Steam Group Moderator. Only administrators can use me.");
                else
                    steamChatMessage(sender,
                        "Commands:\n" +
                        "!announcement <title> <message> <time_in_minutes> - Enable automatic announcement sender. Message will be sent every X minutes.\n" +
                        "!disable - Disable announcement sending."
                    );
            }
                break;

            // When command not recognized
            default:
                if (isAdmin) {
                    switch (command[0]) {
                        case "ANNOUNCEMENT": {
                            const title = command[1],
                                message = command[2],
                                time = command[3];

                            if (isNaN(time))
                                return steamChatMessage(sender, "Second parameter must be number (Time in minutes)");

                            try {
                                await postAnnouncement(title, message, time);

                                fs.ensureFileSync(cache_filename);
                                fs.writeJsonSync(cache_filename, {
                                    title,
                                    message,
                                    time
                                });

                                steamChatMessage(sender, "Announcement posted!");
                                steamChatMessage(sender, "Annoucement will be posted again in " + time + " minutes! Use command !disable to stop timer.");
                                annoucenment_timer = setInterval(async () => {
                                    try {
                                        await postAnnouncement(title, message);
                                        console.log(" - Next announcement in " + time + " minutes.");
                                    } catch (err) {
                                        console.log(err);
                                    }
                                }, time * 60 * 1000);
                            } catch (err) {
                                steamChatMessage(sender, err);
                                console.log(err);
                            }
                        }
                            break;
                        case "DISABLE": {
                            clearInterval(annoucenment_timer);
                            fs.ensureFileSync(cache_filename);
                            fs.writeJsonSync(cache_filename, {});
                            steamChatMessage(sender, "Automatic announcement posting disabled!");
                        }
                            break;
                        case "SHUTDOWN": {

                            steamChatMessage(sender, "Stopping...");
                            client.logOff();
                            console.log("Shutdown command recieved...!");
                            setTimeout(() => {
                                console.log("Shutdown imminent!");
                                process.exit(1);
                            }, 1000);
                        }
                            break;
                        case "RELOG":
                            steamChatMessage(sender, "Relogging...");
                            client.relog();
                            console.log("Relog command recieved...");
                            break;
                        default: {
                            steamChatMessage(sender, "Not valid command!");
                        }
                    }
                }
                else {
                    steamChatMessage(sender, "Not valid command!");
                }
                break;

        }
    } else
        steamChatMessage(sender, "Not valid command!");
});

async function postAnnouncement(title, message) {
    return new Promise(function (resolve, reject) {
        community.postGroupAnnouncement(config.steam_group.steamid, title, message, (err) => {
            if (err)
                reject("Error while posting announcement. Error " + err);
            console.log("Posted announcement!");
            console.log(" - Title: " + title);
            console.log(" - Message: " + message);
            resolve();
        });
    });
}

let restart_timer;
client.on("disconnected", (eresult, msg) => {
    console.log("Disconnected from steam. Reason: " + SteamUser.EResult[eresult]);
    console.log("If connection does not resume within 5 minutes, bot restarts itself.");
    restart_timer = setTimeout(() => {
        console.log("Shutdown imminent!");
        process.exit(2);
    }, 5 * 60 * 1000);
});

manager.on("sentOfferChanged", (offer, oldstate) => {
    declineOffer(offer);
});

manager.on("newOffer", (offer) => {
    declineOffer(offer);
});

community.on("sessionExpired", () => {
    console.log("Session Expired. Relogging...");
    try {
        client.webLogOn();
    } catch (err) {
        console.log(err);
    }
});

function declineOffer(offer) {
    offer.decline((err) => {
        if (err) {
            console.log("An error occurred while declining trade: " + err);
        } else
            steamChatMessage(offer.partner, "Offer declined!");
    });
}

async function setPlaying() {
    try {
        client.gamesPlayed(config.profile.playing_message, true);
    } catch (err) {
        console.log("setPlaying() error: " + err);
    }
}

function steamChatMessage(sender, message) {
    client.chatMessage(sender, message);
}