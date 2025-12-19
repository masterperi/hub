const faceapi = require('face-api.js');
const canvas = require('canvas');
const path = require('path');
const sharp = require('sharp');
const { TextEncoder, TextDecoder } = require('util');

const { Canvas, Image, ImageData } = canvas;

// Monkey patch for Node.js environment
faceapi.env.monkeyPatch({
    Canvas,
    Image,
    ImageData,
    TextEncoder,
    TextDecoder,
});

const MODELS_PATH = path.join(__dirname, '../weights');

let modelsLoaded = false;

export const loadModels = async () => {
    if (modelsLoaded) {
        console.log("✅ Models already loaded");
        return;
    }
    try {
        console.log("📦 Loading FaceAPI models from:", MODELS_PATH);

        console.log("  → Loading SSD MobileNet v1...");
        await faceapi.nets.ssdMobilenetv1.loadFromDisk(MODELS_PATH);
        console.log("    ✓ SSD MobileNet v1 loaded");

        console.log("  → Loading Face Landmark 68...");
        await faceapi.nets.faceLandmark68Net.loadFromDisk(MODELS_PATH);
        console.log("    ✓ Face Landmark 68 loaded");

        console.log("  → Loading Face Recognition...");
        await faceapi.nets.faceRecognitionNet.loadFromDisk(MODELS_PATH);
        console.log("    ✓ Face Recognition loaded");

        modelsLoaded = true;
        console.log("✅ All FaceAPI models loaded successfully!");
    } catch (error) {
        console.error("❌ Error loading FaceAPI models:", error);
        modelsLoaded = false;
        throw error;
    }
};

export async function optimizeBase64Image(base64: string) {
    const base64Data = base64.replace(/^data:image\/\w+;base64,/, "");
    const buffer = Buffer.from(base64Data, "base64");

    // Resize to max 640x640 while maintaining aspect ratio (fit: 'inside')
    // This prevents face squashing which breaks detection
    const optimized = await sharp(buffer)
        .rotate() // Auto-rotate based on EXIF
        .resize(640, 640, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toBuffer();

    return optimized;
}

export function basicAntiSpoofCheck(detection: any) {
    if (!detection) {
        throw new Error("No face detected");
    }

    const score = detection.detection?.score || 0;
    console.log(`🔍 Face detection score: ${(score * 100).toFixed(1)}%`);

    // Stricter threshold (0.4 = 40% confidence) to balance reliability and security
    const MIN_CONFIDENCE = 0.4;
    if (score < MIN_CONFIDENCE) {
        throw new Error(`Face too unclear (${(score * 100).toFixed(0)}%). Ensure good lighting, look at camera directly, and avoid blur.`);
    }

    // Validate face box dimensions - reject if face is too small
    const box = detection.detection?.box;
    if (box) {
        const faceSize = Math.min(box.width, box.height);
        const MIN_SIZE = 40; // Minimum 40px face
        if (faceSize < MIN_SIZE) {
            throw new Error(`Face too small in frame (${faceSize.toFixed(0)}px). Move closer to camera.`);
        }
        console.log(`✓ Face detected: ${faceSize.toFixed(0)}px, confidence: ${(score * 100).toFixed(1)}%`);
    }
}

export const getFaceEmbedding = async (imageBuffer: Buffer | string, timeoutMs: number = 8000): Promise<Float32Array> => {
    await loadModels();

    // Create timeout promise to prevent hangs (8 second limit)
    const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Face detection timeout - taking too long')), timeoutMs);
    });

    const detectionPromise = (async () => {
        let buffer: Buffer;
        if (typeof imageBuffer === 'string') {
            buffer = await optimizeBase64Image(imageBuffer);
        } else {
            // Apply same optimization to raw buffers
            buffer = await sharp(imageBuffer)
                .rotate()
                .resize(640, 640, { fit: 'inside' })
                .jpeg({ quality: 80 })
                .toBuffer();
        }

        console.log(`📸 Processing image buffer (${(buffer.length / 1024).toFixed(1)}KB)`);
        const img = await canvas.loadImage(buffer);

        // Lowered minConfidence from 0.5 to 0.35 for better reliability
        const detection = await faceapi
            .detectSingleFace(img as any, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.35 }))
            .withFaceLandmarks()
            .withFaceDescriptor();

        if (!detection) {
            throw new Error("No face detected in the capture. Please ensure your face is clearly visible, well-lit, and look directly at the camera.");
        }

        basicAntiSpoofCheck(detection);

        return detection.descriptor;
    })();

    return await Promise.race([detectionPromise, timeoutPromise]);
};

export const calculateSimilarity = (embedding1: number[], embedding2: number[]): number => {
    if (!embedding1 || !embedding2 || embedding1.length !== embedding2.length) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < embedding1.length; i++) {
        dotProduct += embedding1[i] * embedding2[i];
        normA += embedding1[i] * embedding1[i];
        normB += embedding2[i] * embedding2[i];
    }

    if (normA === 0 || normB === 0) return 0;

    const similarity = dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));

    return Math.max(0, similarity * 100);
};

console.log('✅ FaceRecognition module finished initialization');
