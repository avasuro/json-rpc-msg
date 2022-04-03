const avasuroEslint = require('eslint-config-avasuro');
const {INDENT, QUOTES, PLUGINS} = require('eslint-config-avasuro/constants');

module.exports = {
    extends: [
        avasuroEslint({
            config: {
                indent: INDENT.SPACES_4,
                quotes: QUOTES.SINGLE
            },
            plugins: [
                PLUGINS.CORE
            ]
        })
    ],
    overrides: [
        // Specific rules for utility and config files in project root:
        {
            files: ['./*'],
            parser: 'espree',
            env: {
                node: true,
                commonjs: true
            }
        }
    ]
};
