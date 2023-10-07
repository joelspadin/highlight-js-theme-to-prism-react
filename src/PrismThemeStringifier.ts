import { AtRule, type AnyNode, type Root, type Rule, type Stringifier } from 'postcss';

const BASE_URL = 'https://github.com/highlightjs/highlight.js/blob/main/src/styles';

export class PrismThemeStringifier {
    constructor(
        private path: string,
        private license: string,
    ) {}

    stringifier: Stringifier = (root, builder) => {
        const theme = getTheme(root);

        builder('/*\n');
        builder(`  Converted from ${BASE_URL}/${this.path}\n\n`);
        builder(indent(this.license.trim(), '  '));
        builder('\n');
        builder('*/\n\n');

        builder('/** @type {import("prism-react-renderer").PrismTheme} */\n');
        builder(`const theme = ${JSON.stringify(theme)};\n\n`);
        builder('module.exports = theme;\n');
    };
}

type PrismThemeStyle = Record<string, string | number | void>;

interface PrismTheme {
    plain: PrismThemeStyle;
    styles: {
        types: string[];
        style: PrismThemeStyle;
        languages?: string[];
    }[];
}

function getTheme(root: AnyNode): PrismTheme {
    const theme: PrismTheme = {
        plain: {},
        styles: [],
    };

    let hasClass = false;
    let hasFunction = false;

    root.root().walkRules((node) => {
        if (node.selectors.includes(HLJS_TITLE_CLASS)) {
            hasClass = true;
        }
        if (node.selectors.includes(HLJS_TITLE_FUNCTION)) {
            hasFunction = true;
        }
    });

    root.root().walkRules((node) => {
        // prism-react-renderer doesn't support at rules.
        if (node.parent instanceof AtRule) {
            return;
        }

        const style = getStyle(node);

        if (node.selector === '.hljs') {
            theme.plain = style;
        } else {
            const types = getTypes(node.selectors, { hasClass, hasFunction });
            if (types.length) {
                theme.styles.push({ types, style });
            }
        }
    });

    return theme;
}

const HLJS_TITLE_GENERIC = '.hljs-title';
const HLJS_TITLE_CLASS = '.hljs-title.class_';
const HLJS_TITLE_FUNCTION = '.hljs-title.function_';

const HLJS_CLASSES: Record<string, string | string[] | undefined> = {
    '.hljs-keyword': ['keyword', 'atrule'],
    '.hljs-built_in': 'builtin',
    '.hljs-title.class_': 'class-name',
    '.hljs-title.function_': 'function',
    '.hljs-literal': 'boolean',
    '.hljs-number': 'number',
    '.hljs-string': ['string', 'char', 'url'],
    '.hljs-symbol': ['symbol', 'entity'],
    '.hljs-regexp': 'regex',
    '.hljs-operator': 'operator',
    '.hljs-variable': 'variable',
    '.hljs-variable.constant_': 'constant',
    '.hljs-property': 'property',
    '.hljs-punctuation': 'punctuation',
    '.hljs-meta': ['important', 'doctype', 'prolog', 'cdata'],
    '.hljs-comment': 'comment',
    '.hljs-tag': 'tag',
    '.hljs-attr': 'attr-name',
    '.hljs-strong': 'bold',
    '.hljs-emphasis': 'italic',
    '.hljs-selector-class': 'selector',
    '.hljs-addition': 'inserted',
    '.hljs-deletion': 'deleted',
};

interface GetTypesOptions {
    hasClass: boolean;
    hasFunction: boolean;
}

function getTypes(selectors: string[], { hasClass, hasFunction }: GetTypesOptions): string[] {
    // .hljs-title.class_ and .hljs-title.function_ should take precedence over
    // .hljs-title, so only apply the generic title styles to classes or functions
    // if the more specific styles aren't present somewhere.
    if (selectors.includes(HLJS_TITLE_GENERIC)) {
        if (!hasClass) {
            selectors = [...selectors, HLJS_TITLE_CLASS];
        }
        if (!hasFunction) {
            selectors = [...selectors, HLJS_TITLE_FUNCTION];
        }
    }

    const types: Set<string> = new Set();

    for (const selector of selectors) {
        const mapped = HLJS_CLASSES[selector];
        if (mapped) {
            for (const value of toArray(mapped)) {
                types.add(value);
            }
        }
    }

    return [...types];
}

function getStyle(node: Rule): PrismThemeStyle {
    const style: PrismThemeStyle = {};

    node.walkDecls((decl) => {
        const [property, value] = getPrismProperty(decl.prop, decl.value);
        if (property) {
            style[property] = value;
        }
    });

    return style;
}

function getPrismProperty(prop: string, value: string): [string | undefined, string] {
    switch (prop) {
        case 'background':
            return ['backgroundColor', extractColor(value)];
    }

    return [toCamelCase(prop), value];
}

function toArray<T>(maybeArray: T | T[]): T[] {
    if (Array.isArray(maybeArray)) {
        return maybeArray;
    }

    return [maybeArray];
}

function toCamelCase(str: string) {
    return str.replaceAll(/-([a-z])/g, (_, c) => c.toUpperCase());
}

function extractColor(value: string) {
    let match = value.match(/#[0-9a-f]+\b|\b(?:rgb|rgba|hwb|hsl|hsla|lab|lch|oklab|oklch|color)\(.+?\)/i);
    if (match) {
        return match[0];
    }

    // If we didn't find a color, assume it's just the first token
    // (It might be a CSS named color).
    return value.split(' ')[0];
}

function indent(str: string, prefix: string): string {
    return str
        .split('\n')
        .map((s) => (prefix + s).trimEnd())
        .join('\n');
}
