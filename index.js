// Assuming the surrounding context remains unchanged
const commands = commandList
    .filter(cmd => cmd.metadata && cmd.metadata.type === 1) // Fixed line
    .map(cmd => ({ // Fixed line
        name: cmd.metadata.name, // Fixed line
        description: cmd.metadata.description || "Polaris Command", // Fixed line
        options: cmd.metadata.args || [], // Fixed line
        type: 1 // Force type to ChatInput (1) // Fixed line
    }));