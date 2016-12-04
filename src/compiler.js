'use strict';
var fs = require('fs');
var path = require('path');
var vueCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler')
var through = require('through2');

var INLINE_REG = /\b(template)\s*:\s*(__inline)\(\s*['"]([^'"]+)['"]\)/;

function toFunction(code) {
    return transpile('function render () {' + code + '}');
};

module.exports = function (sourceFilePath) {
    return function (inputFileRealPath) {
        var data = [];

        // load template file
        var loadTemplate = function (depFilename) {
            var depFileRealPath = path.resolve(path.dirname(inputFileRealPath), depFilename);
            try {
                return fs.readFileSync(depFileRealPath, 'utf-8')
            } catch (e) {
                console.error('[fis3-preprocessor-vueTmpl] Failed to load template from file: ' + depFilename);
            }
        };

        var transformFn = function (chunk, enc, cb) {
            data.push(chunk);
            cb && cb();
        };

        var flushFn = function (cb) {
            var replacer = function (match, depFilename) {
                return 'render : ' + toFunction(compiled.render) + ','
                    + 'staticRenderFns: [' + compiled.staticRenderFns.map(toFunction).join(',') + ']'
            };

            var contents = Buffer.concat(data).toString('utf8');
            var depFilename = null;
            var template = null;
            var compiled = null;

            // if the template is not import by __inline syntax,
            // or the file doesn't exists the "template" attribute.
            if(!INLINE_REG.test(contents)) {
                throw '[fis3-preprocessor-vueTmpl] Unknown error occured before loading the template.'
            }

            depFilename = contents.match(INLINE_REG)[3];
            template = loadTemplate(depFilename);
            compiled = vueCompiler.compile(template);
            contents = contents.replace(INLINE_REG, replacer);

            // errors occured when compiling the template
            if (compiled.errors.length > 0) {
                throw compiled.errors;
            }

            this.push(contents);

            cb();
        };

        return through(transformFn, flushFn);
    }
};