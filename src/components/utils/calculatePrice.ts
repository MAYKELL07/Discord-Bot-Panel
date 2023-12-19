export function calculatePrice(packageType: string, customSpecs: any = null) {
    let price = 0;

    if (packageType === 'custom' && customSpecs) {
        const { ram, memory, cpu } = customSpecs;
        price += ram * 5000;   // 5,000 RP per GB of RAM
        price += memory * 100; // 1,00 RP per GB of Memory
        price += cpu * 2500;   // 2,500 RP per CPU Core
    } else {
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