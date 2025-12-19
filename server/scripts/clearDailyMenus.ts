import connectToDatabase from '../db';
import MessMenu from '../models/MessMenu';

async function clearTodayMenu() {
    try {
        const conn = await connectToDatabase();
        console.log('Connected to database');

        const today = new Date();
        // Set to beginning of day to match how it's likely stored or query by range if needed
        // But usually frontend sends exact date string.
        // Actually, let's just find ALL non-default menus and delete them to be clean for the demo?
        // Or simpler: Delete menus where 'date' is today.
        // The frontend sends `toISOString().split('T')[0]` which is YYYY-MM-DD.
        // The DB stores `Date` objects.
        // Let's just delete non-default menus created recently or all non-default?
        // User said "repeat the foof menu for sun to sat (default)".
        // So cleaning up old specific menus is probably desired.

        // I will delete ALL non-default menus to ensure the weekly schedule takes over completely.
        const result = await MessMenu.deleteMany({ isDefault: { $ne: true } });
        console.log(`Deleted ${result.deletedCount} specific daily menus. Default weekly schedule will now be used.`);

        process.exit(0);
    } catch (error) {
        console.error('Error clearing menus:', error);
        process.exit(1);
    }
}

clearTodayMenu();
