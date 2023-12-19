import { Xendit, Invoice as InvoiceClient } from 'xendit-node';
import { Invoice } from 'xendit-node/invoice/models'
import { ActionRowBuilder, StringSelectMenuBuilder, CommandInteraction, SlashCommandBuilder, ButtonBuilder, ButtonStyle,} from "discord.js";
import { createInvoice } from '../components/xendit/invoice' 
import { createCustomServerModal, createUserRegistrationModal, createUserLoginModal, createPurchaseDetailsModal } from '../components/discord/modals'
import { calculatePrice } from '../components/utils/calculatePrice'
import dotenv from "dotenv";
dotenv.config();

const { XENDIT_SECRET_KEY, PTERODACTYL_API_KEY } = process.env;
const PTERODACTYL_API_ENDPOINT = 'https://panel.menggokil.my.id/'; // Replace with your actual API endpoint

import { PteroApp } from '@devnote-dev/pterojs';
const app = new PteroApp(
    PTERODACTYL_API_ENDPOINT,
    PTERODACTYL_API_KEY || ''
);

const xenditClient = new Xendit({ secretKey: XENDIT_SECRET_KEY || '' });
const { Invoice } = xenditClient;

const xenditInvoiceClient = new InvoiceClient({ secretKey: XENDIT_SECRET_KEY || '' });

let userSessions = new Map();

async function createServer(serverData: any) {
    try {
        const server = await app.servers.create({
            name: serverData.name,
            user: serverData.user,
            egg: serverData.egg,
            description: serverData.description,
            limits: {memory: serverData.memory, cpu: serverData.cpu, disk: serverData.disk},
            dockerImage: serverData.dockerImage,
            startup: serverData.startup,
            environment:serverData.environment,
            deploy:serverData.deploy,
            allocation:serverData.allocation
           })
            .then(console.log)
            .catch(console.error);

        return server;
    } catch (error) {
        console.error('Error creating server:', error);
        throw error;
    }
}

export const data = new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy a Server");

export async function execute(interaction: CommandInteraction) {
    try {
        const user = await interaction.client.users.fetch(interaction.user.id);

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
        // Ask the user if they have an account
        const accountCheckMenu = new ActionRowBuilder<StringSelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('account-check')
                    .setPlaceholder('Do you have an account on our panel?')
                    .addOptions([
                        { label: 'Yes, I have an account', value: 'existing' },
                        { label: 'No, I need to create an account', value: 'new' }
                    ])
            );

        await user.send({ content: 'Please let us know about your account status:', components: [accountCheckMenu] });


        //await user.send({ content: 'Please select your server package:', components: [serverMenu] });

        interaction.client.on('interactionCreate', async (interaction) => {
            if (interaction.isStringSelectMenu()) {
                if (interaction.customId === 'server-selection') {
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

                } else if (interaction.customId === 'account-check') {
                    const accountStatus = interaction.values[0];

                    if (accountStatus === 'new') {
                        await interaction.showModal(createUserRegistrationModal());
                    } else if (accountStatus === 'existing') {
                        await interaction.showModal(createUserLoginModal());
                    }
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
                        Specs: { ram, memory, cpu },
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
                } else if (interaction.customId === 'user-registration') {
                    const email = interaction.fields.getTextInputValue('registrationEmail');
                    const username = interaction.fields.getTextInputValue('registrationUsername');
                    const password = interaction.fields.getTextInputValue('registrationPassword');
                    const firstname = interaction.fields.getTextInputValue('registrationFirstName');
                    const lastname = interaction.fields.getTextInputValue('registrationLastName');


                    try {
                        const newUser = await app.users.create({
                            email,
                            username,
                            password,
                            firstname,
                            lastname
                        });
                        userSessions.set(interaction.user.id, { pteroId: newUser.id });
                        interaction.reply({ content: 'Account created successfully. Please continue with your purchase.' });
                    } catch (error) {
                        interaction.reply({ content: 'Failed to create account.' });
                    }
                } else if (interaction.customId === 'user-login') {
                    const email = interaction.fields.getTextInputValue('loginEmail');


                    try {
                        interaction.reply({ content: 'Login successfully. Please continue with your purchase. The Server Will be created on this account if you input the wrong account you can login again.' });
                    } catch (error) {
                        interaction.reply({ content: 'Failed to Login account. Check Your Email.' });
                    }
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
                        await createInvoice({
                            user: user.username,
                            selectedPackage: selectedPackage,
                            price: price,
                            email: email,
                            whatsapp: whatsapp,
                            currency: currency
                        }).then((invoice) => {
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
                                    try {
                                        const server = await createServer(serverData);
                                        // Inform the user about the server creation
                                        interaction.user.send({ content: `Your server has been created! Server ID: ${server}` });
                                    } catch (error) {
                                        let errorMessage: string;
                                        if (error instanceof Error && 'response' in error && typeof (error as any).response?.message === 'string') {
                                            errorMessage = (error as any).response.message;
                                        } else {
                                            errorMessage = error instanceof Error ? error.message : 'An error occurred while processing your server.';
                                        }

                                        // Send the error message to the user
                                        interaction.user.send({ content: `Error: ${errorMessage}` });
                                    }
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