import connectToDatabase from '../db';
import MessMenu from '../models/MessMenu';

async function checkDb() {
    try {
        await connectToDatabase();
        const menus = await MessMenu.find({ isDefault: true });
        console.log(`Found ${menus.length} default menus.`);
        if (menus.length > 0) {
            console.log('Sample menu item:', JSON.stringify(menus[0], null, 2));
        }
        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

checkDb();
