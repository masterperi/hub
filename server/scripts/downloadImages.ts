
import fs from 'fs';
import path from 'path';
import https from 'https';

const DOWNLOAD_DIR = path.resolve(__dirname, '../public/menu');

if (!fs.existsSync(DOWNLOAD_DIR)) {
    fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Map of filename -> URL
const images = {
    // Breakfast
    'idli.jpg': 'https://images.unsplash.com/photo-1589301760579-37ea9c811566?w=600&q=80',
    'dosa.jpg': 'https://images.unsplash.com/photo-1668236543090-d2f896b6e0f2?w=600&q=80',
    'pongal.jpg': 'https://images.unsplash.com/photo-1668236526189-9a7065992e92?w=600&q=80',
    'upma.jpg': 'https://images.unsplash.com/photo-1626074353765-5bf1d4b3c421?w=600&q=80',
    'vada.jpg': 'https://images.unsplash.com/photo-1630409351241-e90e7f5e47ac?w=600&q=80',
    'puri.jpg': 'https://images.unsplash.com/photo-1614436163996-25cee5f54299?w=600&q=80',
    'paratha.jpg': 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=600&q=80',
    'coffee.jpg': 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=600&q=80',

    // Lunch/Dinner Main
    'biryani.jpg': 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=600&q=80',
    'rice.jpg': 'https://images.unsplash.com/photo-1516714435131-44d6b64dc6a2?w=600&q=80',
    'fried_rice.jpg': 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&q=80',
    'lemon_rice.jpg': 'https://images.unsplash.com/photo-1626074353765-5bf1d4b3c421?w=600&q=80',
    'curd_rice.jpg': 'https://images.unsplash.com/photo-1596797038530-2c107229654b?w=600&q=80',
    'bisibelebath.jpg': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    'roti.jpg': 'https://images.unsplash.com/photo-1626074353765-5bf1d4b3c421?w=600&q=80',

    // Curries/Sides
    'sambar.jpg': 'https://images.unsplash.com/photo-1589301760579-37ea9c811566?w=600&q=80',
    'dal.jpg': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    'paneer.jpg': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80',
    'mixed_veg.jpg': 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=600&q=80', // Paneer as proxy for veg
    'aloo_gobi.jpg': 'https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?w=600&q=80',
    'egg_curry.jpg': 'https://images.unsplash.com/photo-1586557876822-ba914e6b5274?w=600&q=80',
    'veg_kurma.jpg': 'https://images.unsplash.com/photo-1547592180-85f173990554?w=600&q=80',
    'manchurian.jpg': 'https://images.unsplash.com/photo-1567332204680-e8f000add566?w=600&q=80',

    // Accompaniments
    'chutney.jpg': 'https://images.unsplash.com/photo-1589301760579-37ea9c811566?w=600&q=80',
    'raita.jpg': 'https://images.unsplash.com/photo-1626074353765-5bf1d4b3c421?w=600&q=80', // Curd as proxy
    'papad.jpg': 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80', // Thali proxy
    'chips.jpg': 'https://images.unsplash.com/photo-1566478919030-26d9e5adf2d2?w=600&q=80',
    'thali.jpg': 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&q=80',
    'sweet.jpg': 'https://images.unsplash.com/photo-1589119908995-c6837fa14848?w=600&q=80',
};


async function downloadImage(name: string, url: string) {
    const filePath = path.join(DOWNLOAD_DIR, name);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.log(`[FAILED] ${name} - Status: ${response.status}`);
            return false;
        }
        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));
        console.log(`[OK] Downloaded ${name}`);
        return true;
    } catch (error: any) {
        console.log(`[ERROR] ${name} - ${error.message}`);
        return false;
    }
}

async function run() {
    for (const [name, url] of Object.entries(images)) {
        await downloadImage(name, url);
    }
}

run();
