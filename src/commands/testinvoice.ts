import { Xendit, Invoice as InvoiceClient } from 'xendit-node';
import { CreateInvoiceRequest, Invoice } from 'xendit-node/invoice/models'
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, SlashCommandBuilder } from "discord.js";
import dotenv from "dotenv";

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
    .setName("testinvoice")
    .setDescription("Create Invoice");

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
                }
            }, 2000);
    
            const button = new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setLabel('Pay Now')
                .setURL(`${createdInvoice.invoiceUrl}` || '');
    
            const row = new ActionRowBuilder<ButtonBuilder>()
                .addComponents(button);
            await interaction.reply({ content: `Here is your Invoice status: ${createdInvoice.status}`, components: [row], fetchReply: true });
        } catch (error) {
            console.error('Error during interaction:', error);
            await interaction.reply({ content: 'An error occurred while processing your request.' });
        }
    }
    