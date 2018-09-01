# SteamGameKeysBot

Steam bot for automatic moderation of Steam Group powered by [DoctorMcKay's](https://github.com/DoctorMcKay) NodeJS tools for Steam.

 ## ![#f03c15](https://placehold.it/15/f03c15/000000?text=+) Important!

This is **demo** version of original **private bot**.
**I DON'T PROVIDE ANY KIND OF SUPPORT FOR THIS BOT!**
This repository will most likely never be updated again!

**Demo** version features:
* Automatic timed group announcement posting.
* Automatic announcement recovery after crash or restart.

**FULL** version features:
* Multiple Steam groups posting
* Multiple announcement messages
* Configuration of timer (Post rate depending on real time)
* Better logging and bot control features
* *Custom features based on user's wish*

To buy **FULL** version, contact me by any of these links:

* Web: [Baterka.xyz](http://baterka.xyz)
* Steam: [Baterka.xyz 2.0](https://steamcommunity.com/id/czbaterka/)
* Facebook: [@CZBaterka](https://www.facebook.com/CZBaterka/)

### Powered by

* [Node.js](http://nodejs.org)

### Installation

Requires [Node.js](https://nodejs.org/) 8+ (Tested on Node.js 10)

Install the dependencies:

```sh
$ npm i
```

Rename [config.example.js](https://github.com/Baterka/SteamGroupModeratorBot/blob/master/config.example.js) file to config.js and fill all required data.

Start app:

```sh
$ npm start
```

I recommend using [pm2](https://github.com/Unitech/pm2) for managing bot in production.

**For developers:**

Start app in nodemon (Restarts after file change):

```sh
$ npm run dev
```
