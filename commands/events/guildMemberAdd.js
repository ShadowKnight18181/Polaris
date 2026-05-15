const { EmbedBuilder } = require("discord.js")
const config = require("../../config.json")

module.exports = {

async run(client, member, tools) {

    if (config.lockBotToDevOnly && !tools.isDev(member.user)) return

    let guildId = member.guild.id
    let userId = member.user.id

    let db = await tools.fetchSettings(userId, guildId)
    if (!db || !db.settings?.enabled) return

    let userData = db.users?.[userId] || { xp: 0, cooldown: 0 }

    client.db.update(guildId, {
        $set: {
            [`users.${userId}`]: userData
        }
    }).exec()

    let welcomeChannelId = config.welcomeChannel
    if (!welcomeChannelId) return

    let channel = member.guild.channels.cache.get(welcomeChannelId)
    if (!channel) return

    let embed = new EmbedBuilder()
    .setColor("#7c5cff")
    .setAuthor({
        name: member.user.username,
        iconURL: member.user.displayAvatarURL()
    })
    .setTitle(`Welcome to ${member.guild.name}!`)
    .setDescription(`Welcome ${member}! We hope you have a great time here.\n\nYou are starting at level 0.`)
    .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
    .setImage("https://cdn.discordapp.com/attachments/1499822244103192627/1504976821576532108/pexels-photo-5243527.png?ex=6a08f263&is=6a07a0e3&hm=7a82cfd62bc8a555712f2de02b6b24b88c5281fb294f35171ab5e38c830fd9c8")
    .setFooter({
        text: `Member #${member.guild.memberCount}`
    })
    .setTimestamp()

channel.send({
    content: `${member}`,
    embeds: [embed]
}).then(sentMessage => {
    sentMessage.react("👋").catch(() => {})
}).catch(() => {})



}}
