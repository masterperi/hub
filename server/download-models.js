const https = require('https');
const fs = require('fs');
const path = require('path');

const MODELS_PATH = path.join(__dirname, 'weights');

// Ensure directory exists
if (!fs.existsSync(MODELS_PATH)) {
  fs.mkdirSync(MODELS_PATH, { recursive: true });
}

const models = [
  'ssd_mobilenetv1_model-weights_manifest.json',
  'ssd_mobilenetv1_model.bin',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model.bin',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model.bin',
];

const BASE_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/';

let downloaded = 0;
let total = models.length;

function downloadFile(filename) {
  return new Promise((resolve, reject) => {
    const url = BASE_URL + filename;
    const filepath = path.join(MODELS_PATH, filename);

    console.log(`Downloading ${filename}...`);

    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`✅ Downloaded ${filename}`);
        downloaded++;
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function downloadAllModels() {
  try {
    console.log(`📥 Downloading ${total} face-api model files...`);
    for (const model of models) {
      await downloadFile(model);
    }
    console.log(`\n✅ All models downloaded successfully to ${MODELS_PATH}`);
    process.exit(0);
  } catch (error) {
    console.error(`❌ Download failed:`, error.message);
    process.exit(1);
  }
}

downloadAllModels();
