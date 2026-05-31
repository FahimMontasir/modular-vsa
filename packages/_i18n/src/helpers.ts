/**
 * Get translated text from Google Translate.
 *
 * @param text - The text to be translated.
 * @param lang - The target language code for translation.
 * @returns A Promise that resolves to the translated text.
 */
export async function getTranslation(text: string, lang: string): Promise<string> {
  return fetch(
    `https://translate.google.com/translate_a/single?client=gtx&sl=auto&tl=${lang}&dt=t&q=${text}`
  )
    .then((res) => res.json())
    .then((data) => {
      const translated =
        Array.isArray(data) && Array.isArray(data[0]) && Array.isArray(data[0][0])
          ? data[0][0][0]
          : "";

      return typeof translated === "string" ? translated : "";
    })
    .catch(() => "");
}
