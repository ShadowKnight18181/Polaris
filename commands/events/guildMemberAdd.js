const config = require("../../config.json")
const { EmbedBuilder } = require("discord.js")

module.exports = {

async run(client, member, tools) {
    console.log("Welcome event file is running for:", member.user.tag)

    let welcomeChannelId = config.welcomeChannel
    console.log("Welcome channel ID:", welcomeChannelId)

    if (!welcomeChannelId) return console.log("No welcomeChannel in config.json")

    let channel = await member.guild.channels.fetch(welcomeChannelId).catch(console.error)
    if (!channel) return console.log("Welcome channel not found")

    let embed = new EmbedBuilder()
        .setColor("#7c5cff")
        .setAuthor({
            name: member.user.username,
            iconURL: member.user.displayAvatarURL()
        })
        .setTitle(`Welcome to ${member.guild.name}!`)
        .setDescription("We hope you have a great time here.")
        .setImage("https://imgur.com/a/mMyOzIT")
        .setFooter({
            text: `Member #${member.guild.memberCount}`
        })
        .setTimestamp()

    let sentMessage = await channel.send({
        content: `${member}`,
        embeds: [embed]
    }).catch(console.error)

    if (!sentMessage) return console.log("Welcome message failed to send")

    await sentMessage.react("👋").catch(console.error)

    // Level database setup
    let guildId = member.guild.id
    let userId = member.user.id

    let db = await tools.fetchSettings(userId, guildId).catch(console.error)

    if (db && db.settings?.enabled) {
        let userData = db.users?.[userId] || { xp: 0, cooldown: 0 }

        client.db.update(guildId, {
            $set: {
                [`users.${userId}`]: userData
            }
        }).exec()
    }
}

}
