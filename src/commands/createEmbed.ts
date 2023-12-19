import { ChannelType, TextChannel, CommandInteraction, SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
    .setName("createembed")
    .setDescription("Creates an embed from JSON input and sends it to a specified channel")
    .addChannelOption(option =>
        option.setName('channel')
            .setDescription('The channel to send the embed to')
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true));

export function createEmbedJsonModal() {
    console.log("afsodnaowdnoandasdasdasdadassdad")
    const jsonInput = new TextInputBuilder()
        .setCustomId('jsonInput')
        .setLabel("Embed JSON")
        .setStyle(TextInputStyle.Paragraph);

    const modal = new ModalBuilder()
        .setCustomId('createEmbedJsonModal')
        .setTitle('Enter Embed JSON')
        .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(jsonInput));

    return modal;
}
export async function execute(interaction: CommandInteraction) {
    console.log("afsodnaowdnoand")
    if (!interaction.isCommand()) return;

    const channelOption = interaction.options.get('channel');
    const channel = channelOption?.channel;
    if (!channel || !(channel instanceof TextChannel)) {
        await interaction.reply({ content: "Please specify a valid text channel.", ephemeral: true });
        return;
    }
    const channelId = channel.id;
    await interaction.showModal(createEmbedJsonModal());

    interaction.client.on('interactionCreate', async (submitInteraction) => {
        if (!submitInteraction.isModalSubmit()) return;

        if (submitInteraction.customId === 'createEmbedJsonModal') {
            const json = submitInteraction.fields.getTextInputValue('jsonInput');

            try {
                const embedData = JSON.parse(json);
                const embed = new EmbedBuilder(embedData);

                // Retrieve the channel and send the embed
                const targetChannel = submitInteraction.guild?.channels.cache.get(channelId);
                if (targetChannel instanceof TextChannel) {
                    await targetChannel.send({ embeds: [embed] });
                    await submitInteraction.reply({ content: "Embed sent successfully.", ephemeral: true });
                } else {
                    await submitInteraction.reply({ content: "Invalid channel.", ephemeral: true });
                }
            } catch (error) {
                await submitInteraction.reply({ content: "There was an error parsing your JSON. Please ensure it is correctly formatted.", ephemeral: true });
            }
        }
    });

}
