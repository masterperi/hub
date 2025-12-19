
import connectToDatabase from '../db';
import Complaint from '../models/Complaint';
import User from '../models/User';

async function migrateComplaints() {
    try {
        await connectToDatabase();
        console.log('Connected to database');

        const complaints = await Complaint.find();
        console.log(`Found ${complaints.length} complaints to check.`);

        let updatedCount = 0;
        for (const complaint of complaints) {
            if (!complaint.hostelBlock) {
                const user = await User.findById(complaint.userId);
                if (user && user.hostelBlock) {
                    complaint.hostelBlock = user.hostelBlock;
                    await complaint.save();
                    console.log(`Updated complaint ${complaint._id} with block ${user.hostelBlock}`);
                    updatedCount++;
                } else {
                    console.log(`Could not find user or block for complaint ${complaint._id}`);
                    // Fallback to 'A' if absolutely needed or leave as is (will fail validation if re-saved later)
                    // For now, let's assuming user exists.
                }
            }
        }

        console.log(`Migration complete. Updated ${updatedCount} complaints.`);
        process.exit(0);
    } catch (error) {
        console.error('Migration error:', error);
        process.exit(1);
    }
}

migrateComplaints();
