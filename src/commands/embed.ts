import { EmbedBuilder, CommandInteraction, SlashCommandBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("test embed");

export async function execute(interaction: CommandInteraction) {
    const embed = new EmbedBuilder()
        .setTitle("Test Embed")
        .setFields(
            { name: "Field 1", value: "Value 1" },
        )
        .setTimestamp()
    
      interaction.reply({ embeds: [embed]})
}