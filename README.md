# highlight.js to prism-react-renderer theme converter

This script converts [highlight.js](https://highlightjs.org/) color themes to theme modules that can be used in [prism-react-renderer](https://github.com/FormidableLabs/prism-react-renderer).

Note that highlight.js and Prism.js do not use exactly the same scopes, so code may not be highlighted exactly the same way between the two.

## Why?

[Docusaurus](https://docusaurus.io/) uses prism-react-renderer, but I liked highlight.js's themes better.

## How do I use it?

1. Install [Node.js](https://nodejs.org/en) version 18 or newer (earlier versions may work, but are untested).
2. Open a terminal to the repo directory and install dependencies:

   ```sh
   npm install
   npm run compile
   ```

3. Run the script:

   ```sh
   npm start
   ```

   The converted themes will be written to a `themes` folder.

4. Copy the theme you want into your project, import it, and set it as the prism-react-renderer theme. For Docusaurus, the theme is set in your `docusaurus.config.js`:

   ```js
   module.exports = {
     themeConfig: {
       prism: {
         theme: require('./src/themes/github'),
         darkTheme: require('./src/themes/github-dark'),
       },
     },
   };
   ```

### Updating Themes

If new themes have been added to highlight.js, you can update the submodule to bring them in:

```sh
cd highlight.js
git pull
```

PRs to keep this up to date are welcome.
