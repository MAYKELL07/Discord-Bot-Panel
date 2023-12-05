import { Xendit, Invoice as InvoiceClient } from 'xendit-node';
import { CreateInvoiceRequest, Invoice } from 'xendit-node/invoice/models'
import { ActionRowBuilder, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, CommandInteraction, SlashCommandBuilder, ActionRowData, MessageActionRowComponentBuilder, MessageActionRowComponentData, ButtonBuilder, ButtonStyle, Events, ButtonInteraction } from "discord.js";
import dotenv from "dotenv";
import axios from 'axios';

dotenv.config();
const { XENDIT_SECRET_KEY } = process.env;

const xenditClient = new Xendit({ secretKey: XENDIT_SECRET_KEY || '' });
const { Invoice } = xenditClient;

const xenditInvoiceClient = new InvoiceClient({ secretKey: XENDIT_SECRET_KEY || '' });

let userSessions = new Map();
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
        .setLabel('Memory (GB)')
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
        price += ram * 10000;   // 10,000 RP per GB of RAM
        price += memory * 1000; // 1,000 RP per GB of Memory
        price += cpu * 10000;   // 10,000 RP per CPU Core
    } else {
        // Define prices for predefined packages
        switch (packageType) {
            case 'basic':
                price = 50000; // Example price for basic package
                break;
            case 'premium':
                price = 100000; // Example price for premium package
                break;
            // Add cases for other predefined packages
            default:
                price = 0; // Default or error case
        }
    }

    return price;
}

export const data = new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy Server");

export async function execute(interaction: CommandInteraction) {
    try {
        const user = await interaction.client.users.fetch(interaction.user.id);
        const createdInvoice: Invoice = await createInvoice();

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
                        // Add more options as needed
                    ])
            );

        await user.send({ content: 'Please select your server package:', components: [serverMenu] });

        interaction.client.on('interactionCreate', async (selectInteraction) => {
            if (!selectInteraction.isStringSelectMenu()) return;
            if (selectInteraction.customId === 'server-selection') {
                const selectedPackage = selectInteraction.values[0];

                const userId = selectInteraction.user.id;

                if (selectedPackage === 'custom') {
                    await selectInteraction.showModal(createCustomServerModal());
                } else {
                    const price = calculatePrice(selectedPackage);
                    userSessions.set(userId, {
                        selectedPackage: selectedPackage,
                        price: price
                    });
                }
                
                const button = new ButtonBuilder()
                    .setCustomId('details-button')
                    .setStyle(ButtonStyle.Primary)
                    .setLabel('Enter Details');

                const row = new ActionRowBuilder<ButtonBuilder>()
                    .addComponents(button);

                await user.send({
                    content: `Please provide the following details to proceed with your purchase:`,
                    components: [row],
                });
            }
        });

        interaction.client.on('interactionCreate', async (modalInteraction) => {
            if (!modalInteraction.isModalSubmit()) return;
            if (modalInteraction.customId === 'custom-server-specs') {
                const userId = modalInteraction.user.id;
    
                // Capture custom specs from modal
                const ram = parseInt(modalInteraction.fields.getTextInputValue('ram'));
                const memory = parseInt(modalInteraction.fields.getTextInputValue('memory'));
                const cpu = parseInt(modalInteraction.fields.getTextInputValue('cpu'));
    
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
    
                await modalInteraction.reply({
                    content: `Custom server specifications received. Please provide the following details to proceed with your purchase:`,
                    components: [row],
                    ephemeral: true
                });
            }
            // ... [handle other modal submissions]
        });

        const modalPurchaseDetail = new ModalBuilder()
            .setCustomId('purchase-details')
            .setTitle('Purchase Details');

        const emailInput = new TextInputBuilder()
            .setCustomId('payerEmail')
            .setLabel('Your Email for Invoice')
            .setStyle(TextInputStyle.Short);

        const whatsappInput = new TextInputBuilder()
            .setCustomId('payerWhatsApp')
            .setLabel('WhatsApp Number (Optional)')
            .setStyle(TextInputStyle.Short);

        const currencyInput = new TextInputBuilder()
            .setCustomId('currency')
            .setLabel('Preferred Currency')
            .setStyle(TextInputStyle.Short);

        const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput);
        const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(whatsappInput);
        const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(currencyInput);

        modalPurchaseDetail.addComponents(row1, row2, row3);

        interaction.client.on('interactionCreate', async (interaction) => {
            if (!interaction.isButton()) return;
            if (interaction.customId === 'details-button') {
                await interaction.showModal(modalPurchaseDetail);
            }
        });

        // Collect a modal submit interaction
        interaction.awaitModalSubmit({ filter: (interaction) => interaction.customId === 'purchase-details', time: 60000 })
            .then(async (modalInteraction) => {
                // Process the submitted data
                const email = modalInteraction.fields.getTextInputValue('payerEmail');
                const whatsapp = modalInteraction.fields.getTextInputValue('payerWhatsApp');
                const currency = modalInteraction.fields.getTextInputValue('currency');

                await modalInteraction.reply({ content: `Details received. We will process your order shortly.` });
            })
            .catch((error) => {
                console.error(error);
            });

    } catch (error) {
        console.error('Error during interaction:', error);
        await interaction.reply({ content: 'An error occurred while processing your request.' });
    }
}