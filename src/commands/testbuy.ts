import { ActionRowBuilder, EmbedBuilder, CommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, Message } from "discord.js";
import { createCustomServerModal, createUserRegistrationModal, createUserLoginModal, createPurchaseDetailsModal } from '../components/discord/modals'
import { calculatePrice } from '../components/utils/calculatePrice'
import CryptoJS from "crypto-js";
import axios from 'axios';
import dotenv from "dotenv";
dotenv.config();

const { XENDIT_SECRET_KEY, PTERODACTYL_API_KEY } = process.env;

export const data = new SlashCommandBuilder()
    .setName("testbuy")
    .setDescription("test buy");

export async function execute(interaction: CommandInteraction) {
    let database = new Map();
    let m: Message | null = null;
    const user = await interaction.client.users.fetch(interaction.user.id);
    interaction.reply({ content: "Heads up! I sent you a message in your DMs to keep things private. Check it out whenever you're ready!👍", ephemeral: true });

    const askAccountBtn = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('existing-account')
                .setLabel('Yes, I have an account')
                .setStyle(ButtonStyle.Primary),
            new ButtonBuilder()
                .setCustomId('new-account')
                .setLabel('No, I need to create an account')
                .setStyle(ButtonStyle.Secondary)
        );
    m = await user.send({ content: 'Please let us know about your account status:', components: [askAccountBtn] });

    interaction.client.on('interactionCreate', async (interaction) => {
        if (interaction.isButton()) {
            switch (interaction.customId) {
                case 'existing-account':
                    await interaction.showModal(createUserLoginModal());
                    break;
                case 'new-account':
                    await interaction.showModal(createUserRegistrationModal());
                    break;
                case 'continue':
                    try {
                        const response = await axios.get(`https:///panel.menggokil.my.id/api/application/locations`, {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${PTERODACTYL_API_KEY}`
                            }
                        });
                        interface Location {
                            attributes: {
                                id: number;
                                short: string;
                                long?: string;
                            };
                        }
                        const locations: Location[] = response.data.data;
                        const serverType = database.get(interaction.user.id).type;
                        const filteredLocations = locations.filter(location => {
                            return location.attributes.short.startsWith(serverType);
                        });
                        function createServerLocationMenu(filteredLocations: Location[]) {
                            const menu = new ActionRowBuilder<StringSelectMenuBuilder>()
                                .addComponents(
                                    new StringSelectMenuBuilder()
                                        .setCustomId('server-location')
                                        .setPlaceholder('Select a server location')
                                        .addOptions(filteredLocations.map(location => ({
                                            label: location.attributes.short,
                                            description: location.attributes.long || 'No description',
                                            value: `${location.attributes.id.toString()}-${location.attributes.short}`
                                        })))
                                );
                            return menu;
                        }
                        const locationMenu = createServerLocationMenu(filteredLocations);
                        await m!.edit({ content: "Please select a server location:", components: [locationMenu] });
                    } catch (error) {
                        console.error('Error fetching server locations:', error);
                        await m!.edit({ content: "Sorry, I couldn't fetch server locations. Please try again later." });
                    }
                    break
                case "xendit":

                    break
            }
        } else if (interaction.isModalSubmit()) {
            await interaction.deferUpdate()
            switch (interaction.customId) {
                case 'user-registration':
                    const registerForm = {
                        email: interaction.fields.getTextInputValue('registrationEmail'),
                        username: interaction.fields.getTextInputValue('registrationUsername'),
                        first_name: interaction.fields.getTextInputValue('registrationFirstName'),
                        last_name: interaction.fields.getTextInputValue('registrationLastName'),
                        password: interaction.fields.getTextInputValue('registrationPassword'),
                    };
                    const registerId = CryptoJS.SHA256(`${registerForm.password + registerForm.email}`).toString().replace('+', 'pMl3Jk').replace('/', 'Por21Ld').replace('=', 'Ml32');

                    const data = await axios.post('https://panel.menggokil.my.id/api/application/users', {
                        email: registerForm.email,
                        username: registerForm.username,
                        first_name: registerForm.first_name,
                        last_name: registerForm.last_name,
                        password: registerForm.password,
                        external_id: registerId
                    }, {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${PTERODACTYL_API_KEY}`
                        }
                    });
                    const continueBtn = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId('existing-account')
                                .setLabel('Continue')
                                .setStyle(ButtonStyle.Primary)
                        );
                    const embed = new EmbedBuilder()
                        .setColor('Purple')
                        .setTitle('Welcome to the Menggokil Host!')
                        .setURL('https://panel.menggokil.my.id/')
                        .setAuthor({ name: 'Menggokil Host', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://panel.menggokil.my.id' })
                        .setDescription('Cheap But quality is number 1')
                        .setThumbnail('https://i.imgur.com/AfFp7pu.png')
                        .addFields({ name: `Hey there, ${user}! `, value: "Thanks for joining us! We're so excited to have you here.👋" })
                        .setTimestamp()
                        .setFooter({ text: 'Have Fun P.S menggokil admin', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
                    await m!.edit({ embeds: [embed], components: [continueBtn] })
                    break;
                case 'user-login':
                    const loginForm = {
                        email: interaction.fields.getTextInputValue('loginEmail'),
                        password: interaction.fields.getTextInputValue('loginPassword'),
                    };
                    const loginId = CryptoJS.SHA256(`${loginForm.password + loginForm.email}`).toString().replace('+', 'pMl3Jk').replace('/', 'Por21Ld').replace('=', 'Ml32');
                    try {
                        const loginData = await axios.get(`https://panel.menggokil.my.id/api/application/users/external/${loginId}`, {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${PTERODACTYL_API_KEY}`
                            }
                        }).then((res) => res.data);
                        database.set(interaction.user.id, {
                            ...database.get(interaction.user.id),
                            id: loginData.id,
                            username: loginData.username,
                        });
                        const embed = new EmbedBuilder()
                            .setColor("Purple")
                            .setTitle('Unleash the Ultimate Experience!!')
                            .setURL('https://panel.menggokil.my.id/')
                            .setAuthor({ name: 'Menggokil Host', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://panel.menggokil.my.id' })
                            .setDescription('Choose your Minecraft adventure and start crafting incredible experiences!')
                            .setThumbnail('https://i.imgur.com/AfFp7pu.png')
                            .addFields({ name: `Hey there, ${user}!`, value: "Thanks for joining us! We're so excited to have you here. " })
                            .addFields({ name: '**Choose Your Plan:**', value: '\u200B', inline: false })
                            .addFields({ name: '⛏️ Eco', value: 'Budget-friendly starter pack.\n- Shared Ram and Cpu Power\n- Daily backups for peace of mind\n- Limited Support', inline: true })
                            .addFields({ name: '⚙️ Standart', value: 'Growing adventures await with more powerfull Cpu and RAM.\n- 24/7 Customer Support\n- hourly backups', inline: true })
                            .addFields({ name: '💎 Ion', value: 'Unleash the full potential with more location\n- VIP Support\n- 99% Uptime\n- Unlimited Allocation', inline: true })
                            .addFields({ name: '✨ Nuclear', value: 'Ultimate mastery achieved with priority Hardware\n- Dedicated Support 24/7\n- Free Server Templates\n- Free Plugin Setup(Limited)\n- Free My.id Domain\n- Managed server options for hands-off hosting', inline: true })
                            .setImage('https://i.imgur.com/AfFp7pu.png')
                            .setTimestamp()
                            .setFooter({ text: 'Have Fun P.S menggokil admin', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
                        const serverMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('server-selection')
                                    .setPlaceholder('Select a server type')
                                    .addOptions([
                                        { label: '⛏️ Eco', value: 'eco' },
                                        { label: '⚙️ Standart', value: 'std' },
                                        { label: '💎 Ion', value: 'ion' },
                                        { label: '✨ Nuclear', value: 'nuclear' }
                                    ])
                            );
                        await m!.edit({ embeds: [embed], components: [serverMenu] });
                    } catch (error) {
                        await m!.edit({ content: `The password is incorrect or the email is wrong!` });
                    }
                    break
            }
        } else if (interaction.isStringSelectMenu()) {
            try {
                await interaction.deferUpdate()
                switch (interaction.customId) {
                    case 'server-selection':
                        const servertype = interaction.values[0];
                        database.set(interaction.user.id, { ...database.get(interaction.user.id), type: servertype });
                        const serverMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
                            .addComponents(
                                new StringSelectMenuBuilder()
                                    .setCustomId('server-specs')
                                    .setPlaceholder('Select a server specs')
                                    .addOptions([
                                        { label: 'Custom', value: '0' },
                                        { label: '1GB Ram - 1 Cpu - 10GB Storage', value: '1-1-10' },
                                        { label: '2GB Ram - 2 Cpu - 20GB Storage', value: '2-2-20' },
                                        { label: '4Gb Ram - 4 Cpu - 40GB Storage', value: '4-4-40' },
                                        { label: '8Gb Ram - 4 Cpu - 80GB Storage', value: '8-4-80' },
                                        { label: '16Gb Ram - 6 Cpu - 120GB Storage', value: '16-6-120' }
                                    ])
                            );
                        await m!.edit({ content: "Please Choose Your Server Specs", components: [serverMenu] });
                        break;
                    case 'server-specs':
                        const serverspecs = interaction.values[0];
                        if (serverspecs === '0') {
                            await interaction.showModal(createCustomServerModal());
                        } else {
                            const detailedServerSpecs = serverspecs.split('-');
                            database.set(interaction.user.id, {
                                ...database.get(interaction.user.id),
                                ram: detailedServerSpecs[0],
                                cpu: detailedServerSpecs[1],
                                storage: detailedServerSpecs[2]
                            });
                            const continueBtn = new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(
                                    new ButtonBuilder()
                                        .setCustomId('continue')
                                        .setLabel('Continue')
                                        .setStyle(ButtonStyle.Primary)
                                );
                            // Retrieve data from the database
                            const userServerData = database.get(interaction.user.id);
                            const { ram, cpu, storage } = userServerData;
                            const serverType = database.get(interaction.user.id).type;
                            const embed = new EmbedBuilder()
                                .setColor("Purple")
                                .setTitle('Menggokil Hosting')
                                .setURL('https://panel.menggokil.my.id/')
                                .setAuthor({ name: 'Menggokil Host', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://panel.menggokil.my.id' })
                                .setDescription('Your Server Specs')
                                .setThumbnail('https://i.imgur.com/AfFp7pu.png')
                                .addFields({ name: `Hey there, ${user}!`, value: "Please Double Check, You can upgrade the server specs later." })
                                .addFields({ name: '**Your Plan:**', value: '\u200B' })
                                .addFields({ name: 'RAM', value: `${ram} GB` })
                                .addFields({ name: 'CPU', value: `${cpu}` })
                                .addFields({ name: 'MEMORY', value: `${storage} GB` })
                                .addFields({ name: 'Server Type', value: `${serverType}` })
                                .setImage('https://i.imgur.com/AfFp7pu.png')
                                .setTimestamp()
                                .setFooter({ text: 'Have Fun P.S menggokil admin', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
                            await m!.edit({ embeds: [embed], components: [continueBtn] });
                        }
                        break;
                    case 'server-location':
                        const [locationId, locationShort] = interaction.values[0].split('-');
                        database.set(interaction.user.id, { ...database.get(interaction.user.id), locationId: locationId });
                        const payBtn = new ActionRowBuilder<ButtonBuilder>()
                            .addComponents(
                                new ButtonBuilder()
                                    .setCustomId('xendit')
                                    .setLabel('Pay Online')
                                    .setStyle(ButtonStyle.Primary),
                                new ButtonBuilder()
                                    .setCustomId('coins')
                                    .setLabel('Pay Using Gokil Coins')
                                    .setStyle(ButtonStyle.Secondary)
                            );
                        const userServerData = database.get(interaction.user.id);
                        const { ram, cpu, storage } = userServerData;
                        const serverType = database.get(interaction.user.id).type;
                        const price = calculatePrice(serverType, ram, cpu, storage);
                        const embed = new EmbedBuilder()
                            .setColor("Purple")
                            .setTitle('Menggokil Hosting')
                            .setURL('https://panel.menggokil.my.id/')
                            .setAuthor({ name: 'Menggokil Host', iconURL: 'https://i.imgur.com/AfFp7pu.png', url: 'https://panel.menggokil.my.id' })
                            .setDescription('Your Server Specs')
                            .setThumbnail('https://i.imgur.com/AfFp7pu.png')
                            .addFields({ name: `Hey there, ${user}!`, value: "Please Double Check, You can upgrade the server specs later." })
                            .addFields({ name: '**Your Plan:**', value: `Price: ${user}` })
                            .addFields({ name: 'RAM', value: `${ram} GB` })
                            .addFields({ name: 'CPU', value: `${cpu}` })
                            .addFields({ name: 'MEMORY', value: `${storage} GB` })
                            .addFields({ name: 'Server Type', value: serverType, inline: true })
                            .addFields({ name: 'Server Location', value: locationShort, inline: true })
                            .setImage('https://i.imgur.com/AfFp7pu.png')
                            .setTimestamp()
                            .setFooter({ text: 'Have Fun P.S menggokil admin', iconURL: 'https://i.imgur.com/AfFp7pu.png' });
                        m!.edit({ embeds: [embed], components: [payBtn] });
                        break;

                }
            } catch (error) {
                console.error('Error occurred:', error);
                await interaction.editReply({ content: "An error occurred! Please try again later." });
            }
        }
    });
}