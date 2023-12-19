import { CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName('reload')
    .setDescription('Reloads a command.')
    .addStringOption(option =>
        option.setName('command')
            .setDescription('The command to reload.')
            .setRequired(true))

export async function execute(interaction: CommandInteraction) {
    const commandName = interaction.options.get('command', true);
    const command = interaction.client.commands.get(commandName);

    if (!command) {
        return interaction.reply(`There is no command with name \`${commandName}\`!`);
    }
}