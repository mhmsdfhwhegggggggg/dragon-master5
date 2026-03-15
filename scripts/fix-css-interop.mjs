import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const babelFilePath = path.join(__dirname, '..', 'node_modules', 'react-native-css-interop', 'babel.js');

if (fs.existsSync(babelFilePath)) {
    let content = fs.readFileSync(babelFilePath, 'utf8');
    
    if (content.includes('react-native-worklets/plugin')) {
        content = content.replace(/"react-native-worklets\/plugin"/g, '"react-native-worklets-core/plugin"');
        content = content.replace(/'react-native-worklets\/plugin'/g, "'react-native-worklets-core/plugin'");
        fs.writeFileSync(babelFilePath, content);
        console.log('✅ Successfully remapped react-native-worklets/plugin to react-native-worklets-core/plugin in react-native-css-interop/babel.js');
    } else {
        console.log('✅ react-native-worklets/plugin already handled in react-native-css-interop/babel.js');
    }
} else {
    console.log('⚠️ react-native-css-interop/babel.js not found, skipping patch fallback.');
}
