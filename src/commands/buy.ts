import { Xendit, Invoice as InvoiceClient } from 'xendit-node';
import { CreateInvoiceRequest, Invoice } from 'xendit-node/invoice/models'
import { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, CommandInteraction, SlashCommandBuilder, ActionRowData, MessageActionRowComponentBuilder, MessageActionRowComponentData, ButtonBuilder, ButtonStyle, Events, ButtonInteraction } from "discord.js";
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();
const { XENDIT_SECRET_KEY } = process.env;
const PTERODACTYL_API_KEY = process.env.PTERODACTYL_API_KEY; // Your API key
const PTERODACTYL_API_ENDPOINT = 'https://your-pterodactyl-panel.com/api/application/servers'; // Replace with your actual API endpoint

const xenditClient = new Xendit({ secretKey: XENDIT_SECRET_KEY || '' });
const { Invoice } = xenditClient;

const xenditInvoiceClient = new InvoiceClient({ secretKey: XENDIT_SECRET_KEY || '' });

let userSessions = new Map();

const createServer = async (serverData) => {
    try {
        const response = await axios.post(PTERODACTYL_API_ENDPOINT, serverData, {
            headers: {
                'Authorization': `Bearer ${PTERODACTYL_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'Application/vnd.pterodactyl.v1+json'
            }
        });

        return response.data;
    } catch (error) {
        console.error('Error creating server:', error);
        throw error;
    }
};

const createInvoice = async (user: string, selectedPackage: string, price: number, email: string, whatsapp: string, currency: string) => {
    //make me a unique invoice id and add selectedpackage name to the back of it
    const invoiceId = Math.random().toString(36).substring(7) + selectedPackage;
    const invoiceData: CreateInvoiceRequest = {
        "amount": price,
        "payerEmail": email,
        "invoiceDuration": "172800",
        "externalId": invoiceId,
        "description": selectedPackage,
        "currency": "IDR",
        "shouldSendEmail": true,
        "customer": {
            "givenNames": user,
            "email": email,
            "phoneNumber": whatsapp || "08123456789"
        },
        "shouldAuthenticateCreditCard": true,
        "reminderTime": 1
    };
    const response: Invoice = await xenditInvoiceClient.createInvoice({ data: invoiceData });
    return response;
};

function createCustomServerModal() {
    const modal = new ModalBuilder()
        .setCustomId('custom-server-specs')
        .setTitle('Custom Server Specifications');

    const ramInput = new TextInputBuilder()
        .setCustomId('ram')
        .setLabel('RAM (GB)')
        .setPlaceholder('Enter the amount of RAM in GB')
        .setStyle(TextInputStyle.Short);

    const memoryInput = new TextInputBuilder()
        .setCustomId('memory')
        .setLabel('Storage (GB)')
        .setPlaceholder('Enter the disk space in GB')
        .setStyle(TextInputStyle.Short);

    const cpuInput = new TextInputBuilder()
        .setCustomId('cpu')
        .setLabel('CPU Cores')
        .setPlaceholder('Enter the number of CPU cores')
        .setStyle(TextInputStyle.Short);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(ramInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(memoryInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(cpuInput);

    modal.addComponents(row1, row2, row3);

    return modal;
}

function calculatePrice(packageType: string, customSpecs: any = null) {
    let price = 0;

    if (packageType === 'custom' && customSpecs) {
        const { ram, memory, cpu } = customSpecs;
        price += ram * 5000;   // 5,000 RP per GB of RAM
        price += memory * 100; // 1,00 RP per GB of Memory
        price += cpu * 2500;   // 2,500 RP per CPU Core
    } else {
        // Define prices for predefined packages
        switch (packageType) {
            case 'basic':
                price = 20000; // Example price for basic package
                break;
            case 'premium':
                price = 50000; // Example price for premium package
                break;
            case 'ultimate':
                price = 100000; // Example price for premium package
                break;
            // Add cases for other predefined packages
            default:
                price = 0; // Default or error case
        }
    }

    return price;
}

function createPurchaseDetailsModal() {
    const modalPurchaseDetail = new ModalBuilder()
        .setCustomId('purchase-details')
        .setTitle('Purchase Details');

    const emailInput = new TextInputBuilder()
        .setCustomId('payerEmail')
        .setLabel('Your Email for Invoice')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const whatsappInput = new TextInputBuilder()
        .setCustomId('payerWhatsApp')
        .setLabel('WhatsApp Number (Optional)')
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

    const currencyInput = new TextInputBuilder()
        .setCustomId('currency')
        .setLabel('Preferred Currency')
        .setStyle(TextInputStyle.Short)
        .setRequired(false)

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(whatsappInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(currencyInput);

    modalPurchaseDetail.addComponents(row1, row2, row3);

    return modalPurchaseDetail;
}

export const data = new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy Server");

export async function execute(interaction: CommandInteraction) {
    try {
        const user = await interaction.client.users.fetch(interaction.user.id);
        const userId = interaction.user.id;

        // Reply in the channel
        await interaction.reply({ content: 'A message has been sent to your DM with further instructions. Please check your DM.', ephemeral: true });

        const serverMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('server-selection')
                    .setPlaceholder('Select a server package')
                    .addOptions([
                        { label: 'Basic Package', value: 'basic' },
                        { label: 'Premium Package', value: 'premium' },
                        { label: 'Ultimate Package', value: 'ultimate' },
                        { label: 'Custom Server', value: 'custom' }
                    ])
            );

        await user.send({ content: 'Please select your server package:', components: [serverMenu] });

        interaction.client.on('interactionCreate', async (interaction) => {
            if (interaction.isStringSelectMenu() && interaction.customId === 'server-selection') {
                // Handle server selection
                const selectedPackage = interaction.values[0];
                const userId = interaction.user.id;

                await interaction.deferUpdate();

                if (selectedPackage === 'custom') {
                    await interaction.showModal(createCustomServerModal());
                } else {
                    const price = calculatePrice(selectedPackage);
                    userSessions.set(userId, {
                        selectedPackage: selectedPackage,
                        price: price
                    });

                    const button = new ButtonBuilder()
                        .setCustomId('details-button')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('Enter Details');

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(button);

                    await interaction.user.send({
                        content: `Please provide the following details to proceed with your purchase:`,
                        components: [row],
                    });
                }

                // Edit the original message with the updated menu

            } else if (interaction.isModalSubmit()) {
                const userId = interaction.user.id;

                if (interaction.customId === 'custom-server-specs') {
                    // Capture custom specs from modal
                    const ram = parseInt(interaction.fields.getTextInputValue('ram'));
                    const memory = parseInt(interaction.fields.getTextInputValue('memory'));
                    const cpu = parseInt(interaction.fields.getTextInputValue('cpu'));

                    // Calculate the price for custom specs
                    const price = calculatePrice('custom', { ram, memory, cpu });
                    userSessions.set(userId, {
                        selectedPackage: 'custom',
                        customSpecs: { ram, memory, cpu },
                        price: price
                    });

                    // Send the details button after receiving custom specs
                    const button = new ButtonBuilder()
                        .setCustomId('details-button')
                        .setStyle(ButtonStyle.Primary)
                        .setLabel('Enter Details');

                    const row = new ActionRowBuilder<ButtonBuilder>()
                        .addComponents(button);

                    await interaction.reply({
                        content: `Custom server specifications received. Please provide the following details to proceed with your purchase:`,
                        components: [row],
                        ephemeral: true
                    });
                } else if (interaction.customId === 'purchase-details') {
                    const sessionData = userSessions.get(userId);
                    if (!sessionData) {
                        // Handle the case where session data is not found
                        await interaction.reply({ content: 'Session data not found. Please start the process again.' });
                        return;
                    }

                    // Process the submitted data
                    const email = interaction.fields.getTextInputValue('payerEmail');
                    const whatsapp = interaction.fields.getTextInputValue('payerWhatsApp');
                    const currency = interaction.fields.getTextInputValue('currency');


                    await interaction.reply({ content: `Details received. We will process your order for the ${sessionData.selectedPackage} package shortly.` });

                    //get user seession data for the selected package and price
                    const selectedPackage = sessionData.selectedPackage;
                    const price = sessionData.price;



                    try {
                        await createInvoice(user.username, selectedPackage, price, email, whatsapp, currency).then((invoice) => {
                            //button to the invoice link
                            const button = new ButtonBuilder()
                                .setStyle(ButtonStyle.Link)
                                .setLabel('Pay Now')
                                .setURL(invoice.invoiceUrl);


                            const row = new ActionRowBuilder<ButtonBuilder>()
                                .addComponents(button);

                            const invoiceUrl = invoice.invoiceUrl;
                            const invoiceId = invoice.id;
                            const invoiceAmount = invoice.amount;
                            const invoiceCurrency = invoice.currency;

                            const invoiceDetails = `Invoice ID: ${invoiceId}\nInvoice Amount: ${invoiceAmount} ${invoiceCurrency}\nInvoice URL: ${invoiceUrl}`;

                            // Send the invoice details to the user
                            interaction.user.send({ content: `Please complete the payment for your invoice:\n${invoiceDetails}`, components: [row] });

                            // Check the invoice status periodically
                            const checkInterval = setInterval(async () => {
                                const response: Invoice = await xenditInvoiceClient.getInvoiceById({ invoiceId: invoiceId as string });
                                if (response.status !== 'PENDING') {
                                    clearInterval(checkInterval);

                                    // Sending a DM to the user
                                    await user.send(`Your invoice with ID ${invoiceId} is now paid. Thank you!`)

                                    const serverData = {
                                        "name": user.username + selectedPackage,
                                        "user": 1,
                                        "egg": 1,
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
                                    };
                                    
                                    createServer(serverData)
                                        .then(response => console.log(`Server created: ${response}`))
                                        .catch(error => console.error('Failed to create server:', error))
                                }
                            }, 2000);
                        });
                    } catch (error) {
                        let errorMessage: string;
                        if (error instanceof Error && 'response' in error && typeof (error as any).response?.message === 'string') {
                            errorMessage = (error as any).response.message;
                        } else {
                            errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your request.';
                        }

                        // Send the error message to the user
                        interaction.user.send({ content: `Error: ${errorMessage}` });
                    }
                }
            } else if (interaction.isButton() && interaction.customId === 'details-button') {
                const purchaseModal = createPurchaseDetailsModal()
                await interaction.showModal(purchaseModal);
            }
        });
    } catch (error) {
        console.error('Error during interaction:', error);
        await interaction.reply({ content: 'An error occurred while processing your request.' });
    }
}