import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const LICENSE_KEY = 'falcon_license_key';
const HWID_KEY = 'falcon_hardware_id';

export class LicenseStore {
    static async saveLicense(key: string): Promise<void> {
        if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync(LICENSE_KEY, key);
        } else {
            localStorage.setItem(LICENSE_KEY, key);
        }
    }

    static async getLicense(): Promise<string | null> {
        if (Platform.OS !== 'web') {
            return await SecureStore.getItemAsync(LICENSE_KEY);
        }
        return localStorage.getItem(LICENSE_KEY);
    }

    static async saveHardwareId(hwid: string): Promise<void> {
        if (Platform.OS !== 'web') {
            await SecureStore.setItemAsync(HWID_KEY, hwid);
        } else {
            localStorage.setItem(HWID_KEY, hwid);
        }
    }

    static async getHardwareId(): Promise<string | null> {
        if (Platform.OS !== 'web') {
            return await SecureStore.getItemAsync(HWID_KEY);
        }
        return localStorage.getItem(HWID_KEY);
    }

    static async clear(): Promise<void> {
        if (Platform.OS !== 'web') {
            await SecureStore.deleteItemAsync(LICENSE_KEY);
            await SecureStore.deleteItemAsync(HWID_KEY);
        } else {
            localStorage.removeItem(LICENSE_KEY);
            localStorage.removeItem(HWID_KEY);
        }
    }

    static async isActivated(): Promise<boolean> {
        const key = await this.getLicense();
        return !!key;
    }
}
