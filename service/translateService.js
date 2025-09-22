async function translateText(text, targetLang) {
  if (!text) return text;

  try {
    const response = await fetch('https://libretranslate.com/translate', {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        q: text,
        source: "en",    // your DB is English by default
        target: targetLang,
        format: "text"
      })
    });

    const data = await response.json();
    return data?.translatedText || text;
  } catch (err) {
    console.error("LibreTranslate error:", err.message);
    return text; // fallback to original text
  }
}

async function translateFields(fields, targetLang) {
  if (!Array.isArray(fields)) return fields;
  return Promise.all(fields.map(text => translateText(text, targetLang)));
}

module.exports = { translateText, translateFields };