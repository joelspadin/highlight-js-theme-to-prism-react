import postcss from 'postcss';
import * as fs from 'fs/promises';
import { glob } from 'glob';
import * as path from 'path';
import * as prettier from 'prettier';
import { PrismThemeStringifier } from './PrismThemeStringifier';

const SOURCE_URL = 'https://github.com/highlightjs/highlight.js/blob/main/src/styles/';

const licensePath = path.resolve(__dirname, '../highlight.js/LICENSE');
const sourceDir = path.resolve(__dirname, '../highlight.js/src/styles');
const destDir = path.resolve(__dirname, '../themes');

function changeExtension(filepath: string, ext: string) {
    return filepath.substring(0, filepath.length - path.extname(filepath).length) + ext;
}

async function getThemes() {
    return await glob(`${sourceDir}/**/*.css`);
}

async function convertTheme(source: string, license: string) {
    const name = path.relative(sourceDir, source);
    const dest = changeExtension(path.join(destDir, name), '.js');

    const css = await fs.readFile(source, 'utf-8');
    const stringifier = new PrismThemeStringifier(SOURCE_URL + name, license);

    const result = await postcss().process(css, { from: source, to: dest, stringifier: stringifier.stringifier });
    const theme = await prettier.format(result.css, { parser: 'typescript' });

    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, theme, 'utf-8');
}

async function main() {
    const license = await fs.readFile(licensePath, 'utf-8');
    const themes = await getThemes();

    for (const theme of themes) {
        await convertTheme(theme, license);
    }
}

main();
