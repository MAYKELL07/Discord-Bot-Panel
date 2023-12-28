// invoice.ts
import { Invoice as InvoiceClient } from 'xendit-node';
import { CreateInvoiceRequest, Invoice } from 'xendit-node/invoice/models'
import dotenv from 'dotenv';

dotenv.config();
const { XENDIT_SECRET_KEY } = process.env;

const xenditInvoiceClient = new InvoiceClient({ secretKey: XENDIT_SECRET_KEY || '' });

// Type definitions for parameters, if not already defined
interface InvoiceParams {
    user: string;
    selectedPackage: string;
    price: number;
    email: string;
    whatsapp: string;
    currency: string;
}

export const createInvoice = async ({ user, selectedPackage, price, email, whatsapp, currency }: InvoiceParams): Promise<Invoice> => {
    const invoiceId = Math.random().toString(36).substring(7) + selectedPackage;
    const invoiceData: CreateInvoiceRequest = {
        amount: price,
        payerEmail: email,
        invoiceDuration: "86400",
        externalId: invoiceId,
        description: selectedPackage,
        currency: currency,
        shouldSendEmail: true,
        customer: {
            givenNames: user,
            email: email,
            phoneNumber: whatsapp || "08123456789"
        },
        shouldAuthenticateCreditCard: true,
        reminderTime: 1
    };

    const response: Invoice = await xenditInvoiceClient.createInvoice({ data: invoiceData });
    return response;
};
