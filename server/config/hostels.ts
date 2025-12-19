export interface HostelBoundary {
    points: Array<{ latitude: number; longitude: number }>;
    center?: { latitude: number; longitude: number };
    radius?: number; // in meters
}

// Valluvar Mens Hostel coordinates (actual location)
const VALLUVAR_CONFIG = {
    points: [
        { latitude: 11.38595, longitude: 78.00028 },
        { latitude: 11.38695, longitude: 78.00028 },
        { latitude: 11.38695, longitude: 78.00128 },
        { latitude: 11.38595, longitude: 78.00128 },
    ],
    center: { latitude: 11.38645, longitude: 78.00078 },
    radius: 1000,
};

// TEST CONFIG (based on user's current GPS: 11.63264 78.1320192)
const TEST_CONFIG = {
    points: [
        { latitude: 11.63264, longitude: 78.1320192 },
        { latitude: 11.63364, longitude: 78.1320192 },
        { latitude: 11.63364, longitude: 78.1330192 },
        { latitude: 11.63264, longitude: 78.1330192 },
    ],
    center: { latitude: 11.63264, longitude: 78.1320192 },
    radius: 3000,
};

export const HOSTEL_LOCATIONS: Record<string, HostelBoundary> = {
    "Kaveri Ladies Hostel": { ...TEST_CONFIG },
    "Amaravathi Ladies Hostel": { ...TEST_CONFIG },
    "Bhavani Ladies Hostel": { ...TEST_CONFIG },
    "Dheeran Mens Hostel": { ...TEST_CONFIG },
    "Valluvar Mens Hostel": { ...TEST_CONFIG },
    "Ilango Mens Hostel": { ...TEST_CONFIG },
    "Bharathi Mens Hostel": { ...TEST_CONFIG },
    "Kamban Mens Hostel": { ...TEST_CONFIG },
    "Ponnar Mens Hostel": { ...TEST_CONFIG },
    "Sankar Mens Hostel": { ...TEST_CONFIG },
    "TEST - My Location": { ...TEST_CONFIG },
};
