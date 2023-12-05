import { Xendit, Invoice as InvoiceClient } from 'xendit-node';
import { CreateInvoiceRequest, Invoice } from 'xendit-node/invoice/models'
import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, ButtonStyle, CommandInteraction, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();
const { XENDIT_SECRET_KEY } = process.env;

const xenditClient = new Xendit({ secretKey: XENDIT_SECRET_KEY || '' });
const { Invoice } = xenditClient;

const xenditInvoiceClient = new InvoiceClient({ secretKey: XENDIT_SECRET_KEY || '' });

const invoiceData: CreateInvoiceRequest = {
    "amount": 10000,
    "payerEmail": "Qangga714@gmail.com",
    "invoiceDuration": "172800",
    "externalId": "test1234",
    "description": "Test Invoice",
    "currency": "IDR",
    "shouldSendEmail": true,
    "reminderTime": 1
}

const createInvoice = async () => {
    const response: Invoice = await xenditInvoiceClient.createInvoice({ data: invoiceData });
    return response;
};

export const data = new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy Server");

    export async function execute(interaction: CommandInteraction) {
        try {
            const user = await interaction.client.users.fetch(interaction.user.id);
            const createdInvoice: Invoice = await createInvoice();
            const invoiceId = createdInvoice.id || '';
    
            // Check the invoice status periodically
            const checkInterval = setInterval(async () => {
                const response: Invoice = await xenditInvoiceClient.getInvoiceById({ invoiceId });
                if (response.status !== 'PENDING') {
                    clearInterval(checkInterval);
    
                    // Sending a DM to the user
                    await user.send(`Your invoice with ID ${invoiceId} is now paid. Thank you!`);
                    // Optionally, also reply in the channel where the command was initiated
                    await interaction.followUp({ content: `Invoice ${invoiceId} is now paid. A confirmation message has been sent via DM.` });

                    await user.send(`Creating Server, Please Wait...`)
                    const serverResponse = axios.post('https://panel.menggokil.my.id/api/application/servers', {
                        "name": "Building",
                        "user": 1,
                        "egg": 1,
                        "docker_image": "quay.io/pterodactyl/core:java",
                        "startup": "java -Xms128M -Xmx128M -jar server.jar",
                        "environment": {
                          "BUNGEE_VERSION": "latest",
                          "SERVER_JARFILE": "server.jar"
                        },
                        "limits": {
                          "memory": 128,
                          "swap": 0,
                          "disk": 512,
                          "io": 500,
                          "cpu": 100
                        },
                        "feature_limits": {
                          "databases": 5,
                          "backups": 1
                        },
                        "allocation": {
                          "default": 17
                        }
                      })
                }
            }, 2000);
    
            const select = new StringSelectMenuBuilder()
			.setCustomId('starter')
			.setPlaceholder('Make a selection!')
			.addOptions(
				new StringSelectMenuOptionBuilder()
					.setLabel('Bulbasaur')
					.setDescription('The dual-type Grass/Poison Seed Pokémon.')
					.setValue('bulbasaur'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Charmander')
					.setDescription('The Fire-type Lizard Pokémon.')
					.setValue('charmander'),
				new StringSelectMenuOptionBuilder()
					.setLabel('Squirtle')
					.setDescription('The Water-type Tiny Turtle Pokémon.')
					.setValue('squirtle'),
			);

            const row = new ActionRowBuilder()
			.addComponents(select);

            await interaction.reply({ content: `Here is your Invoice status: ${createdInvoice.status}`, components: [row], fetchReply: true });
        } catch (error) {
            console.error('Error during interaction:', error);
            await interaction.reply({ content: 'An error occurred while processing your request.' });
        }
    }
    