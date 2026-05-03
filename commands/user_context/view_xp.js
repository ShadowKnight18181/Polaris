module.exports = {
metadata: {
    type: 2, // 👈 2 = User Context Menu
    name: "View Rank", // 👈 Use spaces/caps (this is what people see in the menu)
    // Note: Do NOT include 'description' or 'args'
},

async run(client, int, tools) {
    // This triggers the /rank logic when someone right-clicks a user
    const rankCommand = client.commands.get("rank");
    if (rankCommand) return rankCommand.run(client, int, tools);
}
}