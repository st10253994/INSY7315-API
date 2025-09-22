const axios = require('axios');

// Generic text translation
async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text; //Skips the translation if the language is set to english
  
  console.log("- Text to translate:", text);
  console.log("- Target language:", targetLang);
  console.log("- Text length:", text.length);
  
  try {
    // MyMemory API endpoint
    const response = await axios.get('https://api.mymemory.translated.net/get', {
      params: {
        q: text,
        langpair: `en|${targetLang}`
      }
    });
    
    console.log("- Response status:", response.status);
    console.log("- Response data:", response.data);
    
    const data = response.data;
    
    // Check if translation was successful
    if (data.responseStatus === 200 && data.responseData) {
      return data.responseData.translatedText || text;
    } else {
      console.log("- Translation failed, using original text");
      return text;
    }
  } catch (err) {
    console.error("MyMemory error:", err.response?.status, err.response?.data || err.message);
    return text; // fallback if API fails
  }
}

// For amenities (arrays of strings)
async function translateFields(fields, targetLang) {
  if (!Array.isArray(fields)) return fields;
  return Promise.all(fields.map(text => translateText(text, targetLang)));
}

// Domain-specific: listings
async function translateListing(listing, targetLang) {
  if (targetLang === 'en') return listing; // Skip if English
  
  try {
    return {
      ...listing,
      title: await translateText(listing.title, targetLang),
      description: await translateText(listing.description, targetLang),
      amenities: listing.amenities
        ? await translateFields(listing.amenities, targetLang)
        : []
    };
  } catch (err) {
    console.error("Error translating listing:", err.message);
    return listing; // Return original if translation fails
  }
}

// For translating multiple listings
async function translateAllListings(listings, targetLang) {
  if (!Array.isArray(listings) || targetLang === 'en') return listings;
  
  console.log(`- Translating ${listings.length} listings to ${targetLang}`);
  
  try {
    // Translate all listings in parallel
    const translatedListings = await Promise.all(
      listings.map(listing => translateListing(listing, targetLang))
    );
    
    console.log(`- Successfully translated ${translatedListings.length} listings`);
    return translatedListings;
  } catch (err) {
    console.error("Error translating all listings:", err.message);
    return listings; // Return original if translation fails
  }
}

async function translateFavourite(favourite, targetLang) {
  if (targetLang === 'en') return favourite; // Skip if English
  
  try {
    // Check if listingDetail exists and has the nested structure
    if (favourite.listingDetail) {
      return {
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
    }
    // Fallback: return original if structure is different
    return favourite;
  } catch (err) {
    console.error("Error translating favourite:", err.message);
    return favourite; // Return original if translation fails
  }
}

async function translateAllFavourites(favourites, targetLang) {
    if(targetLang === 'en') return favourites;

    console.log(`- Translating ${favourites.length} listings to ${targetLang}`);

    try {
        //Translate all favourites in parallel
        const translatedFavourites = await Promise.all(
            favourites.map(favourite => translateFavourite(favourite, targetLang))
        );

        console.log(`- Successfully translated ${translatedFavourites.length} listings`);
        return translatedFavourites;
    } catch (err) {
        console.error("Error translating all favourite listings:", err.message);
        return favourites; // Return original if translation fails
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