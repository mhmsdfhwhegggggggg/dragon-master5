import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';

/**
 * Media Pixelator Service V10.0
 * Bypasses Telegram's Media Hash collision detection by subtly modifying bytes.
 */
export class MediaPixelatorService {
    private static instance: MediaPixelatorService;

    private constructor() { }

    static getInstance(): MediaPixelatorService {
        if (!MediaPixelatorService.instance) {
            MediaPixelatorService.instance = new MediaPixelatorService();
        }
        return MediaPixelatorService.instance;
    }

    /**
     * Randomize a single byte in a media buffer to change its hash
     * Crucial for bypassing "Spam Media" filters.
     */
    async pixelate(buffer: Buffer): Promise<Buffer> {
        if (buffer.length < 100) return buffer;

        const newBuffer = Buffer.from(buffer);

        // Pick a random index towards the end of the file (usually metadata or non-critical pixel data)
        const randomIndex = Math.floor(buffer.length * 0.9) + Math.floor(Math.random() * (buffer.length * 0.05));

        // Subtly change the byte at that index
        newBuffer[randomIndex] = (newBuffer[randomIndex] + 1) % 256;

        return newBuffer;
    }

    /**
     * Helper to verify hash change
     */
    calculateHash(buffer: Buffer): string {
        return crypto.createHash('md5').update(buffer).digest('hex');
    }
}

export const mediaPixelatorService = MediaPixelatorService.getInstance();
