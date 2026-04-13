import axios from 'axios';

const OPENCAGE_API_KEY = process.env.OPENCAGE_API_KEY!;

interface GeocodingResult {
  latitude: number;
  longitude: number;
  formattedAddress: string;
}

export const geocodeLocation = async (location: string, city: string): Promise<GeocodingResult | null> => {
  try {
    const query = `${location}, ${city}, Indonesia`;
    const response = await axios.get('https://api.opencagedata.com/geocode/v1/json', {
      params: {
        q: query,
        key: OPENCAGE_API_KEY,
        language: 'id',
        countrycode: 'id',
        limit: 1,
      },
    });

    const results = response.data.results;
    if (!results || results.length === 0) return null;

    const { lat, lng } = results[0].geometry;
    const formattedAddress = results[0].formatted;

    return { latitude: lat, longitude: lng, formattedAddress };
  } catch (error) {
    console.error('[GEOCODING] Error:', error);
    return null;
  }
};
