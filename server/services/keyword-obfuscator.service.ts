/**
 * Keyword Obfuscator Service V10.0
 * Injects non-perceivable characters into "risky" keywords to bypass semantic filters.
 */
export class KeywordObfuscatorService {
    private static instance: KeywordObfuscatorService;

    // Zero-width space, non-joiner, etc.
    private static readonly ZERO_WIDTH_CHARS = ['\u200B', '\u200C', '\u200D', '\uFEFF'];

    private constructor() { }

    static getInstance(): KeywordObfuscatorService {
        if (!KeywordObfuscatorService.instance) {
            KeywordObfuscatorService.instance = new KeywordObfuscatorService();
        }
        return KeywordObfuscatorService.instance;
    }

    /**
     * Obfuscate a specific word using zero-width characters
     */
    obfuscate(word: string): string {
        if (word.length < 2) return word;

        const char = KeywordObfuscatorService.ZERO_WIDTH_CHARS[Math.floor(Math.random() * KeywordObfuscatorService.ZERO_WIDTH_CHARS.length)];
        const middle = Math.floor(word.length / 2);

        // Inject in the middle: word -> wo[zw]rd
        return word.slice(0, middle) + char + word.slice(middle);
    }

    /**
     * Auto-detect and obfuscate risky keywords in a text
     */
    obfuscateText(text: string, riskyKeywords: string[]): string {
        let result = text;
        for (const keyword of riskyKeywords) {
            const regex = new RegExp(keyword, 'gi');
            result = result.replace(regex, (match) => this.obfuscate(match));
        }
        return result;
    }
}

export const keywordObfuscatorService = KeywordObfuscatorService.getInstance();
