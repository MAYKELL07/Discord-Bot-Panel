import { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } from "discord.js";

export function createUserRegistrationModal() {
    const modal = new ModalBuilder()
        .setCustomId('user-registration')
        .setTitle('User Registration');
    const firstNameInput = new TextInputBuilder()
        .setCustomId('registrationFirstName')
        .setLabel('First Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const lastNameInput = new TextInputBuilder()
        .setCustomId('registrationLastName')
        .setLabel('Last Name')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const emailInput = new TextInputBuilder()
        .setCustomId('registrationEmail')
        .setLabel('Your Email')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const usernameInput = new TextInputBuilder()
        .setCustomId('registrationUsername')
        .setLabel('Choose a Username')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    const passwordInput = new TextInputBuilder()
        .setCustomId('registrationPassword')
        .setLabel('Choose a Password')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);
    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(firstNameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(lastNameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(usernameInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(passwordInput)
    );
    return modal;
}

export function createUserLoginModal() {
    const modal = new ModalBuilder()
        .setCustomId('user-login')
        .setTitle('User Login');

    const emailInput = new TextInputBuilder()
        .setCustomId('loginEmail')
        .setLabel('Your Email')
        .setPlaceholder('Please Input your email Very Important!!')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

    const passwordInput = new TextInputBuilder()
       .setCustomId('loginPassword')
       .setLabel('Your password')
       .setStyle(TextInputStyle.Short)
       .setRequired(true);

    modal.addComponents(
        new ActionRowBuilder<TextInputBuilder>().addComponents(emailInput),
        new ActionRowBuilder<TextInputBuilder>().addComponents(passwordInput)
    );

    return modal;
}

export function createCustomServerModal() {
    const modal = new ModalBuilder()
        .setCustomId('custom-server-specs')
        .setTitle('Custom Server Specifications');

    const ramInput = new TextInputBuilder()
        .setCustomId('ram')
        .setLabel('RAM (GB)')
        .setPlaceholder('Enter the amount of RAM in GB')
        .setStyle(TextInputStyle.Short);

    const storageInput = new TextInputBuilder()
        .setCustomId('Storage')
        .setLabel('Storage (GB)')
        .setPlaceholder('Enter the disk space in GB')
        .setStyle(TextInputStyle.Short);

    const cpuInput = new TextInputBuilder()
        .setCustomId('cpu')
        .setLabel('CPU Cores')
        .setPlaceholder('Enter the number of CPU cores')
        .setStyle(TextInputStyle.Short);

    const row1 = new ActionRowBuilder<TextInputBuilder>().addComponents(ramInput);
    const row2 = new ActionRowBuilder<TextInputBuilder>().addComponents(storageInput);
    const row3 = new ActionRowBuilder<TextInputBuilder>().addComponents(cpuInput);

    modal.addComponents(row1, row2, row3);

    return modal;
}

export function createPurchaseDetailsModal() {
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