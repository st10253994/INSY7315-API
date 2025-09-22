const fetch = require('node-fetch');

// Generic text translation
async function translateText(text, targetLang) {
  if (!text || targetLang === 'en') return text; //Skips the translation if the language is set to english

  try {
    const response = await fetch('https://libretranslate.de/translate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: targetLang,
        format: "text"
      })
    });

    const data = await response.json();
    return data.translatedText || text;
  } catch (err) {
    console.error("LibreTranslate error:", err.message);
    return text; // fallback if API fails
  }
}

// For amenities (arrays of strings)
async function translateFields(fields, targetLang) {
  if (!Array.isArray(fields)) return fields;
  return Promise.all(fields.map(text => translateText(text, targetLang)));
}

// Domain‑specific: listings
async function translateListing(listing, targetLang) {
  return {
    ...listing,
    title: await translateText(listing.title, targetLang),
    description: await translateText(listing.description, targetLang),
    amenities: listing.amenities
      ? await translateFields(listing.amenities, targetLang)
      : []
  };
}

module.exports = {
  translateText,
  translateFields,
  translateListing
};