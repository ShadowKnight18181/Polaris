module.exports = {
metadata: {
    type: 2, // 👈 2 = User Context Menu
    name: "View on Leaderboard", // 👈 Use spaces/caps! Context menus are not slash commands.
    // Note: Do NOT include 'description' or 'args' here.
},

async run(client, int, tools) {
    // This allows the right-click to trigger the same logic as /top
    const topCommand = client.commands.get("top");
    if (topCommand) return topCommand.run(client, int, tools);
}
}