export interface HostelBoundary {
    points: Array<{ latitude: number; longitude: number }>;
    center?: { latitude: number; longitude: number };
    radius?: number;
}

export const HOSTEL_CODES: Record<string, string> = {
    "Kaveri Ladies Hostel": "girls 2547",
    "Amaravathi Ladies Hostel": "ladies 9021",
    "Bhavani Ladies Hostel": "ladies 3341",
    "Dheeran Mens Hostel": "mens 4452",
    "Valluvar Mens Hostel": "mens 1123",
    "Ilango Mens Hostel": "mens 7789",
    "Bharathi Mens Hostel": "mens 5564",
    "Kamban Mens Hostel": "mens 8891",
    "Ponnar Mens Hostel": "mens 1002",
    "Sankar Mens Hostel": "mens 9987",
};

export const HOSTEL_BLOCKS = Object.keys(HOSTEL_CODES);

// Hostel location boundaries for geofencing
const COMMON_CONFIG: HostelBoundary = {
    points: [
        { latitude: 11.144133685376177, longitude: 77.32563956861075 },
        { latitude: 11.14409414234636, longitude: 77.32570506094395 },
        { latitude: 11.14401011339013, longitude: 77.32565468222612 },
        { latitude: 11.144042242111555, longitude: 77.32559674670058 },
    ],
    center: { latitude: 11.14407004575, longitude: 77.3256515145 },
    radius: 2000,
};

// Valluvar Mens Hostel location (user's actual location)
const VALLUVAR_CONFIG: HostelBoundary = {
    points: [
        { latitude: 11.144117373841127, longitude: 77.32564097386906 },
        { latitude: 11.144091799587592, longitude: 77.32569682903318 },
        { latitude: 11.144015076813519, longitude: 77.32566207470883 },
        { latitude: 11.144044304539364, longitude: 77.32559877218952 },
    ],
    center: { latitude: 11.14406714, longitude: 77.32564966 },
    radius: 2000, // 500 meters radius for development
};

export const HOSTEL_LOCATIONS: Record<string, HostelBoundary> = {
    "Kaveri Ladies Hostel": { ...VALLUVAR_CONFIG },
    "Amaravathi Ladies Hostel": { ...VALLUVAR_CONFIG },
    "Bhavani Ladies Hostel": { ...VALLUVAR_CONFIG },
    "Dheeran Mens Hostel": { ...VALLUVAR_CONFIG },
    "Valluvar Mens Hostel": { ...VALLUVAR_CONFIG },
    "Ilango Mens Hostel": { ...VALLUVAR_CONFIG },
    "Bharathi Mens Hostel": { ...VALLUVAR_CONFIG },
    "Kamban Mens Hostel": { ...VALLUVAR_CONFIG },
    "Ponnar Mens Hostel": { ...VALLUVAR_CONFIG },
    "Sankar Mens Hostel": { ...VALLUVAR_CONFIG },
    "TEST - My Location": { ...VALLUVAR_CONFIG },
};
