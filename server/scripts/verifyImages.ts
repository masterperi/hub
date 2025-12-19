
import fs from 'fs';
import path from 'path';

const seedFile = path.join(__dirname, 'seedMenus.ts');
const content = fs.readFileSync(seedFile, 'utf-8');

// Regex to find all imageUrl: '...'
const urlRegex = /imageUrl:\s*'([^']+)'/g;
const matches: string[] = [];
let match: RegExpExecArray | null;
while ((match = urlRegex.exec(content)) !== null) {
    matches.push(match[1]);
}

console.log(`Found ${matches.length} image URLsToCheck.`);

async function checkUrl(url: string) {
    try {
        const fullUrl = url.startsWith('http') ? url : `http://localhost:5000${url}`;
        const response = await fetch(fullUrl, { method: 'HEAD', redirect: 'follow' });
        if (!response.ok) {
            // Try GET
            const getResponse = await fetch(fullUrl, { method: 'GET', redirect: 'follow' });
            if (!getResponse.ok) {
                console.log(`[FAILED] ${getResponse.status} - ${fullUrl}`);
                return false;
            }
            const contentType = getResponse.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                console.log(`[INVALID CONTENT] ${contentType} - ${fullUrl}`);
                return false;
            }
        } else {
            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.startsWith('image/')) {
                // Double check with GET if HEAD didn't give content-type (sometimes happens)
                const getResponse = await fetch(fullUrl, { method: 'GET', redirect: 'follow' });
                const getType = getResponse.headers.get('content-type');
                if (!getType || !getType.startsWith('image/')) {
                    console.log(`[INVALID CONTENT] ${getType} - ${fullUrl}`);
                    return false;
                }
            }
        }
        console.log(`[OK] ${fullUrl.substring(0, 50)}...`);
        return true;
    } catch (error: any) {
        console.log(`[ERROR] ${error.message} - ${url}`);
        return false;
    }
}

async function run() {
    let failures = 0;
    for (const url of matches) {
        const success = await checkUrl(url);
        if (!success) failures++;
    }
    console.log(`Verification complete. ${failures} failures found.`);
}

run();
