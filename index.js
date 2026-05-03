const Discord = require("discord.js")
const fs = require("fs")

const config = require("./config.json")

const Tools = require("./classes/Tools.js")
const Model = require("./classes/DatabaseModel.js")

// automatic files: these handle discord status and version number, manage them with the dev commands
const autoPath = "./json/auto/"
if (!fs.existsSync(autoPath)) fs.mkdirSync(autoPath)
if (!fs.existsSync(autoPath + "status.json")) fs.copyFileSync("./json/default_status.json", autoPath + "status.json")
if (!fs.existsSync(autoPath + "version.json")) fs.writeFileSync(autoPath + "version.json", JSON.stringify({ version: "1.0.0", updated: Date.now() }, null, 2))

const rawStatus = require("./json/auto/status.json")
const version = require("./json/auto/version.json")

const startTime = Date.now()

// create client
const client = new Discord.Client({
    allowedMentions: { parse: ["users"] },
    makeCache: Discord.Options.cacheWithLimits({ MessageManager: 0 }),
    intents: ['Guilds', 'GuildMessages', 'DirectMessages', 'GuildVoiceStates', 'MessageContent'].map(i => Discord.GatewayIntentBits[i]),
    partials: ['Channel'].map(p => Discord.Partials[p]),
    failIfNotExists: false
})

if (!client.shard) {
    console.error("No sharding info found!\nMake sure you start the bot from polaris.js, not index.js")
    return process.exit()
}

client.shard.id = client.shard.ids[0]

client.globalTools = new Tools(client);

// connect to db
client.db = new Model("servers", require("./database_schema.js").schema)

// command files
// command files
const dir = "./commands/"
client.commands = new Discord.Collection()
fs.readdirSync(dir).forEach(type => {
    fs.readdirSync(dir + type).filter(x => x.endsWith(".js")).forEach(file => {
        let command = require(dir + type + "/" + file)
        if (!command.metadata) command.metadata = { name: file.split(".js")[0] }
        
        // 🛠️ Updated logic to convert folder names to numbers
        command.metadata.type = (type === "user_context") ? 2 : (type === "message_context" ? 3 : 1)
        
        client.commands.set(command.metadata.name, command)
    })
})

client.statusData = rawStatus
client.updateStatus = function() {
    let status = client.statusData
    client.user.setPresence({ activities: status.type ? [{ name: status.name, state: status.state || undefined, type: Discord.ActivityType[status.type], url: status.url }] : [], status: status.status })
}

// when online
client.on("ready", () => {
    if (client.shard.id == client.shard.count - 1) console.log(`Bot online! (${+process.uptime().toFixed(2)} secs)`)
    client.startupTime = Date.now() - startTime
    client.version = version

    client.application.commands.fetch()
.then(async cmds => {
    if (cmds.size < 1) {
        console.info("!!! No global commands found. Deploying...");
        
        // Filter out buttons/misc and only send valid slash commands
        const slashCommands = client.commands
            .filter(cmd => cmd.metadata && !cmd.metadata.type.includes('button'))
            .map(cmd => ({
                name: cmd.metadata.name,
                description: cmd.metadata.description || "Polaris Command",
                options: cmd.metadata.options || [],
                type: 1 // Force type to ChatInput (1)
            }));

        try {
            await client.application.commands.set(slashCommands);
            console.log("✅ Commands deployed successfully!");
        } catch (err) {
            console.error("❌ Deployment failed:", err);
        }
    }
});
    client.updateStatus()
    setInterval(client.updateStatus, 15 * 60000);

    // run the web server
    if (client.shard.id == 0 && config.enableWebServer) require("./web_app.js")(client)
})

// on message
client.on("ready", async () => {
    // This forces the bot to register your commands to your main server immediately
    const testGuildId = '1499504291080179854'; 
    const guild = client.guilds.cache.get(testGuildId);
    
    if (guild) {
        await guild.commands.set(client.commands.map(c => c.metadata));
        console.log(`Commands deployed instantly to ${guild.name}`);
    }
});

// on interaction
client.on("interactionCreate", async int => {
    
    if (!int.guild) return int.reply("You can't use commands in DMs!")
        
    // for setting changes
    if (int.isStringSelectMenu()) {
        if (int.customId.startsWith("configmenu_")) {
            if (int.customId.split("_")[1] != int.user.id) return int.deferUpdate()
            let configData = int.values[0].split("_").slice(1)
            let configCmd = (configData[0] == "dir" ? "button:settings_list" : "button:settings_view")
            client.commands.get(configCmd).run(client, int, new Tools(client, int), configData)
        }
        return;
    }

    // also for setting changes
    else if (int.isModalSubmit()) {
        if (int.customId.startsWith("configmodal")) {
            let modalData = int.customId.split("~")
            if (modalData[2] != int.user.id) return int.deferUpdate()
            client.commands.get("button:settings_edit").run(client, int, new Tools(client, int), modalData[1])
        }
        return;
    }

    // general commands and buttons
    let foundCommand = client.commands.get(int.isButton() ? `button:${int.customId.split("~")[0]}` : int.commandName)
    if (!foundCommand) return
    else if (foundCommand.metadata.slashEquivalent) foundCommand = client.commands.get(foundCommand.metadata.slashEquivalent)

    let tools = new Tools(client, int)

    // dev perm check
    if (foundCommand.metadata.dev && !tools.isDev()) return tools.warn("Only developers can use this!")
    else if (config.lockBotToDevOnly && !tools.isDev()) return tools.warn("Only developers can use this bot!")

    try { await foundCommand.run(client, int, tools) }
    catch(e) { console.error(e); int.reply({ content: "**Error!** " + e.message, ephemeral: true }) }
})

client.on('error', e => console.warn(e))
client.on('warn', e => console.warn(e))

process.on('uncaughtException', e => console.warn(e))
process.on('unhandledRejection', (e, p) => console.warn(e))

client.login(process.env.DISCORD_TOKEN)