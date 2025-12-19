import connectToDatabase from '../db';
import MessMenu from '../models/MessMenu';

const DEFAULT_MENUS = [
    // Sunday (0)
    {
        dayOfWeek: 0,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Masala Dosa', imageUrl: '/images/dosa.jpg' },
            { name: 'Sambar', imageUrl: '/images/sambar.jpg' },
            { name: 'Coconut Chutney', imageUrl: '/images/chutney.jpg' },
            { name: 'Coffee/Tea', imageUrl: '/images/coffee.jpg' }
        ],
        items: "Masala Dosa, Sambar, Coconut Chutney, Coffee/Tea",
        isDefault: true
    },
    {
        dayOfWeek: 0,
        mealType: 'lunch',
        menuItems: [
            { name: 'Veg Biryani', imageUrl: '/images/biryani.jpg' },
            { name: 'Raita', imageUrl: '/images/raita.jpg' },
            { name: 'Papad', imageUrl: '/images/papad.jpg' }
        ],
        items: "Veg Biryani, Raita, Papad, Salad",
        isDefault: true
    },
    {
        dayOfWeek: 0,
        mealType: 'dinner',
        menuItems: [
            { name: 'Paneer Butter Masala', imageUrl: '/images/paneer.jpg' },
            { name: 'Chapati', imageUrl: '/images/paratha.jpg' }, // Using paratha for chapati
            { name: 'Jeera Rice', imageUrl: '/images/rice.jpg' }
        ],
        items: "Paneer Butter Masala, Chapati, Jeera Rice",
        isDefault: true
    },

    // Monday (1)
    {
        dayOfWeek: 1,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Idli', imageUrl: '/images/idli.jpg' },
            { name: 'Vada', imageUrl: '/images/vada.jpg' },
        ],
        items: "Idli, Vada, Sambar, Chutney",
        isDefault: true
    },
    {
        dayOfWeek: 1,
        mealType: 'lunch',
        menuItems: [
            { name: 'Rice', imageUrl: '/images/rice.jpg' },
            { name: 'Dal Fry', imageUrl: '/images/dal.jpg' },
            { name: 'Aloo Gobi', imageUrl: '/images/aloo_gobi.jpg' }
        ],
        items: "Rice, Dal Fry, Aloo Gobi, Curd",
        isDefault: true
    },
    {
        dayOfWeek: 1,
        mealType: 'dinner',
        menuItems: [
            { name: 'Roti', imageUrl: '/images/roti.jpg' },
            { name: 'Mix Veg Curry', imageUrl: '/images/mixed_veg.jpg' },
        ],
        items: "Roti, Mix Veg Curry, Rice, Dal",
        isDefault: true
    },

    // Tuesday (2)
    {
        dayOfWeek: 2,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Puri Bhaji', imageUrl: '/images/puri.jpg' }
        ],
        items: "Puri Bhaji, Tea/Coffee",
        isDefault: true
    },
    {
        dayOfWeek: 2,
        mealType: 'lunch',
        menuItems: [
            { name: 'Curd Rice', imageUrl: '/images/curd_rice.jpg' },
            { name: 'Lemon Rice', imageUrl: '/images/lemon_rice.jpg' }
        ],
        items: "Curd Rice, Lemon Rice, Pickle, Fryums",
        isDefault: true
    },
    {
        dayOfWeek: 2,
        mealType: 'dinner',
        menuItems: [
            { name: 'Chapati', imageUrl: '/images/paratha.jpg' },
            { name: 'Egg Curry', imageUrl: '/images/egg_curry.jpg' },
            { name: 'Veg Kurma', imageUrl: '/images/veg_kurma.jpg' }
        ],
        items: "Chapati, Egg Curry/Veg Kurma",
        isDefault: true
    },

    // Wednesday (3)
    {
        dayOfWeek: 3,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Upma', imageUrl: '/images/upma.jpg' }
        ],
        items: "Upma, Chutney, Tea",
        isDefault: true
    },
    {
        dayOfWeek: 3,
        mealType: 'lunch',
        menuItems: [
            { name: 'Rice', imageUrl: '/images/rice.jpg' },
            { name: 'Sambar', imageUrl: '/images/sambar.jpg' },
            { name: 'Beans Poriyal', imageUrl: '/images/mixed_veg.jpg' }
        ],
        items: "Rice, Sambar, Beans Poriyal, Rasam",
        isDefault: true
    },
    {
        dayOfWeek: 3,
        mealType: 'dinner',
        menuItems: [
            { name: 'Fried Rice', imageUrl: '/images/fried_rice.jpg' },
            { name: 'Manchurian', imageUrl: '/images/manchurian.jpg' }
        ],
        items: "Fried Rice, Manchurian, Sauce",
        isDefault: true
    },

    // Thursday (4)
    {
        dayOfWeek: 4,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Pongal', imageUrl: '/images/pongal.jpg' },
            { name: 'Vada', imageUrl: '/images/vada.jpg' }
        ],
        items: "Pongal, Vada, Chutney",
        isDefault: true
    },
    {
        dayOfWeek: 4,
        mealType: 'lunch',
        menuItems: [
            { name: 'Phulka', imageUrl: '/images/paratha.jpg' },
            { name: 'Dal Tadka', imageUrl: '/images/dal.jpg' }
        ],
        items: "Phulka, Dal Tadka, Rice, Sabzi",
        isDefault: true
    },
    {
        dayOfWeek: 4,
        mealType: 'dinner',
        menuItems: [
            { name: 'Dosa', imageUrl: '/images/dosa.jpg' },
            { name: 'Peanut Chutney', imageUrl: '/images/chutney.jpg' }
        ],
        items: "Dosa, Peanut Chutney, Sambar",
        isDefault: true
    },

    // Friday (5)
    {
        dayOfWeek: 5,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Vermicelli Upma', imageUrl: '/images/upma.jpg' } // Fallback
        ],
        items: "Vermicelli Upma, Chutney",
        isDefault: true
    },
    {
        dayOfWeek: 5,
        mealType: 'lunch',
        menuItems: [
            { name: 'Bisibelebath', imageUrl: '/images/bisibelebath.jpg' },
            { name: 'Potato Chips', imageUrl: '/images/chips.jpg' }
        ],
        items: "Bisibelebath, Potato Chips, Curd Rice",
        isDefault: true
    },
    {
        dayOfWeek: 5,
        mealType: 'dinner',
        menuItems: [
            { name: 'Idli', imageUrl: '/images/idli.jpg' },
            { name: 'Sambar', imageUrl: '/images/sambar.jpg' }
        ],
        items: "Idli, Sambar, Chutney",
        isDefault: true
    },

    // Saturday (6)
    {
        dayOfWeek: 6,
        mealType: 'breakfast',
        menuItems: [
            { name: 'Aloo Paratha', imageUrl: '/images/paratha.jpg' },
            { name: 'Curd', imageUrl: '/images/chutney.jpg' } // Fallback
        ],
        items: "Aloo Paratha, Curd, Pickle",
        isDefault: true
    },
    {
        dayOfWeek: 6,
        mealType: 'lunch',
        menuItems: [
            { name: 'Mint Rice', imageUrl: '/images/lemon_rice.jpg' }, // Using lemon rice as fallback
            { name: 'Paneer Curry', imageUrl: '/images/paneer.jpg' }
        ],
        items: "Mint Rice, Paneer Curry, Salad",
        isDefault: true
    },
    {
        dayOfWeek: 6,
        mealType: 'dinner',
        menuItems: [
            { name: 'Special Dinner', imageUrl: '/images/thali.jpg' },
            { name: 'Sweet', imageUrl: '/images/sweet.jpg' }
        ],
        items: "Poori, Chana Masala, Sweet, Ice Cream",
        isSpecial: true,
        specialNote: "Weekend Special!",
        isDefault: true
    },
];

import User from '../models/User';

async function seedMenus() {
    try {
        const conn = await connectToDatabase();
        console.log('Connected to database');

        // Get all distinct hostel blocks
        const blocks = await User.distinct('hostelBlock');
        const uniqueBlocks = blocks.filter(b => b); // Filter null/undefined

        if (uniqueBlocks.length === 0) {
            console.log('No hostel blocks found in Users. Seeding for default "A" block.');
            uniqueBlocks.push('A');
        }

        console.log(`Seeding menus for blocks: ${uniqueBlocks.join(', ')}`);

        // Clear existing default menus
        await MessMenu.deleteMany({ isDefault: true });
        console.log('Cleared existing default menus');

        const allMenus = [];
        for (const block of uniqueBlocks) {
            const blockMenus = DEFAULT_MENUS.map(menu => ({
                ...menu,
                hostelBlock: block
            }));
            allMenus.push(...blockMenus);
        }

        // Insert new default menus
        await MessMenu.insertMany(allMenus);
        console.log(`Seeded default menus with images for blocks: ${uniqueBlocks.join(', ')}`);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding menus:', error);
        process.exit(1);
    }
}

seedMenus();
