/**
 * Get translated text from Google Translate.
 *
 * @param text - The text to be translated.
 * @param lang - The target language code for translation.
 * @returns A Promise that resolves to the translated text.
 */
export async function getTranslation(text: string, lang: string): Promise<string> {
  const placeholders: string[] = [];
  const maskedText = text.replace(/\{[^}]+\}|<\/?[0-9]+>/g, (placeholder) => {
    const token = `ZXQPH${placeholders.length}QXZ`;
    placeholders.push(placeholder);
    return token;
  });
  const search = new URLSearchParams({
    client: "gtx",
    sl: "auto",
    tl: lang,
    dt: "t",
    q: maskedText,
  });

  return fetch(`https://translate.google.com/translate_a/single?${search}`)
    .then((res) => res.json())
    .then((data) => {
      const translated =
        Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])
          ? data[0][0][0]
          : "";

      if (typeof translated !== "string") return "";

      return placeholders.reduce(
        (result, placeholder, index) =>
          result.replace(new RegExp(`ZXQPH\\s*${index}\\s*QXZ`, "gi"), placeholder),
        translated
      );
    })
    .catch(() => "");
}
