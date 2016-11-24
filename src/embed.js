'use strict';

var path = require('path');
var through = require('through2');

var URI_REG = /\b(__uri)\(\s*('|")([^'"]+)\2\s*\)/g; 
var INLINE_REG = /\b(__inline)\(\s*('|")([^'"]+)\2\s*\)/g;

/**
 * Browserify transform
 * change `__uri('path')` and `__inline('path')` to relative path from sourceFilePath
 */
module.exports = function (sourceFilePath) {
    return function (inputFileRealPath) {
        var data = [];

        var transformFn = function (chunk, enc, cb) {
            data.push(chunk);
            cb && cb();
        };

        var flushFn = function (cb) {
            var replacer = function (match, embedFn, quote, depFileName) {
                var depFileRealPath = path.resolve(path.dirname(inputFileRealPath), depFileName);
                var depFileRelativePath = path.relative(path.dirname(sourceFilePath), depFileRealPath).replace(/\\/g, '/');
                return embedFn + '(' + quote + depFileRelativePath + quote + ')';                
            };

            var contents = Buffer.concat(data).toString('utf8').replace(INLINE_REG, replacer).replace(URI_REG, replacer);

            this.push(contents);

            cb();
        };

        return through(transformFn, flushFn);
    };
};