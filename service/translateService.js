const axios = require('axios');

/**
 * Translates a single text string to the target language using MyMemory API.
 * Returns the original text if the target language is English or if translation fails.
 * @param {string} text - The text to translate.
 * @param {string} targetLang - The target language code (e.g., 'es', 'fr').
 * @returns {Promise<string>} The translated text.
 */
async function translateText(text, targetLang) {
  console.log(`[translateText] Entry: text="${text}", targetLang="${targetLang}"`);
  if (!text || targetLang === 'en') {
    console.log(`[translateText] Exit: No translation needed, returning original text.`);
    return text;
  }

  try {
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: `en|${targetLang}`
      }
    });

    const data = response.data;

    if (data.responseStatus === 200 && data.responseData) {
      console.log(`[translateText] Exit: Translation successful.`);
      return data.responseData.translatedText || text;
    } else {
      console.warn(`[translateText] Exit: Translation failed, using original text.`);
      return text;
    }
  } catch (err) {
    console.error(`[translateText] Error:`, err.response?.status, err.response?.data || err.message);
    console.log(`[translateText] Exit: API error, returning original text.`);
    return text;
  }
}

/**
 * Translates an array of strings (e.g., amenities) to the target language.
 * @param {Array<string>} fields - Array of text fields to translate.
 * @param {string} targetLang - The target language code.
 * @returns {Promise<Array<string>>} Array of translated strings.
 */
async function translateFields(fields, targetLang) {
  console.log(`[translateFields] Entry: fields.length=${fields?.length || 0}, targetLang="${targetLang}"`);
  if (!Array.isArray(fields)) {
    console.log(`[translateFields] Exit: Not an array, returning original fields.`);
    return fields;
  }
  const result = await Promise.all(fields.map(text => translateText(text, targetLang)));
  console.log(`[translateFields] Exit: Translated ${result.length} fields.`);
  return result;
}

/**
 * Translates the main fields of a listing object to the target language.
 * Returns the original listing if the target language is English or if translation fails.
 * @param {object} listing - The listing object.
 * @param {string} targetLang - The target language code.
 * @returns {Promise<object>} The translated listing object.
 */
async function translateListing(listing, targetLang) {
  console.log(`[translateListing] Entry: listingId="${listing?._id}", targetLang="${targetLang}"`);
  if (targetLang === 'en') {
    console.log(`[translateListing] Exit: No translation needed, returning original listing.`);
    return listing;
  }

  try {
    const translated = {
      ...listing,
      title: await translateText(listing.title, targetLang),
      description: await translateText(listing.description, targetLang),
      amenities: listing.amenities
        ? await translateFields(listing.amenities, targetLang)
        : []
    };
    console.log(`[translateListing] Exit: Translation successful for listingId="${listing?._id}"`);
    return translated;
  } catch (err) {
    console.error(`[translateListing] Error:`, err.message);
    console.log(`[translateListing] Exit: Translation failed, returning original listing.`);
    return listing;
  }
}

/**
 * Translates an array of listing objects to the target language.
 * Returns the original array if the target language is English or if translation fails.
 * @param {Array<object>} listings - Array of listing objects.
 * @param {string} targetLang - The target language code.
 * @returns {Promise<Array<object>>} Array of translated listings.
 */
async function translateAllListings(listings, targetLang) {
  console.log(`[translateAllListings] Entry: count=${Array.isArray(listings) ? listings.length : 0}, targetLang="${targetLang}"`);
  if (!Array.isArray(listings) || targetLang === 'en') {
    console.log(`[translateAllListings] Exit: No translation needed, returning original listings.`);
    return listings;
  }

  try {
    const translatedListings = await Promise.all(
      listings.map(listing => translateListing(listing, targetLang))
    );
    console.log(`[translateAllListings] Exit: Successfully translated ${translatedListings.length} listings.`);
    return translatedListings;
  } catch (err) {
    console.error(`[translateAllListings] Error:`, err.message);
    console.log(`[translateAllListings] Exit: Translation failed, returning original listings.`);
    return listings;
  }
}

/**
 * Translates the fields of a favourite listing object to the target language.
 * Returns the original favourite if the target language is English or if translation fails.
 * @param {object} favourite - The favourite object.
 * @param {string} targetLang - The target language code.
 * @returns {Promise<object>} The translated favourite object.
 */
async function translateFavourite(favourite, targetLang) {
  console.log(`[translateFavourite] Entry: favouriteId="${favourite?._id}", targetLang="${targetLang}"`);
  if (targetLang === 'en') {
    console.log(`[translateFavourite] Exit: No translation needed, returning original favourite.`);
    return favourite;
  }

  try {
    if (favourite.listingDetail) {
      const translated = {
        ...favourite,
        listingDetail: {
          ...favourite.listingDetail,
          title: await translateText(favourite.listingDetail.title, targetLang),
          description: await translateText(favourite.listingDetail.description, targetLang),
          amenities: favourite.listingDetail.amenities
            ? await translateFields(favourite.listingDetail.amenities, targetLang)
            : []
        }
      };
      console.log(`[translateFavourite] Exit: Translation successful for favouriteId="${favourite?._id}"`);
      return translated;
    }
    console.log(`[translateFavourite] Exit: No listingDetail, returning original favourite.`);
    return favourite;
  } catch (err) {
    console.error(`[translateFavourite] Error:`, err.message);
    console.log(`[translateFavourite] Exit: Translation failed, returning original favourite.`);
    return favourite;
  }
}

/**
 * Translates an array of favourite listing objects to the target language.
 * Returns the original array if the target language is English or if translation fails.
 * @param {Array<object>} favourites - Array of favourite objects.
 * @param {string} targetLang - The target language code.
 * @returns {Promise<Array<object>>} Array of translated favourites.
 */
async function translateAllFavourites(favourites, targetLang) {
  console.log(`[translateAllFavourites] Entry: count=${Array.isArray(favourites) ? favourites.length : 0}, targetLang="${targetLang}"`);
  if (targetLang === 'en') {
    console.log(`[translateAllFavourites] Exit: No translation needed, returning original favourites.`);
    return favourites;
  }

  try {
    const translatedFavourites = await Promise.all(
      favourites.map(favourite => translateFavourite(favourite, targetLang))
    );
    console.log(`[translateAllFavourites] Exit: Successfully translated ${translatedFavourites.length} favourites.`);
    return translatedFavourites;
  } catch (err) {
    console.error(`[translateAllFavourites] Error:`, err.message);
    console.log(`[translateAllFavourites] Exit: Translation failed, returning original favourites.`);
    return favourites;
  }
}

module.exports = {
  translateText,
  translateFields,
  translateListing,
  translateAllListings,
  translateAllFavourites,
  translateFavourite
};