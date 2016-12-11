/*!
 * fis3-preprocessor-vueTmpl v1.0.5
 * copyright 2016 Hiufan Zheng
 * email: Hiufan@qq.com
 * Released under the MIT License.
 */

'use strict';
var fs = require('fs');
var path = require('path');
var vueCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler')
var through = require('through2');

// 正则匹配 "template: __inline('xxx.html')"
var INLINE_REG = /\b(template)\s*:\s*(__inline)\(\s*['"]([^'"]+)['"]\)/;

function toFunction(code) {
    return transpile('function render () {' + code + '}');
};

// 功能：在构建阶段先对模板文件进行编译
// sourceFilePath: 入口文件路径
// inputFileRealPath: 其它引用文件的路径
module.exports = function (sourceFilePath) {
    return function (inputFileRealPath) {
        var data = [];

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

            // 支持fis3的__inline函数，直接使用vue-template-compiler编译模板
            if(!INLINE_REG.test(contents)) {
                this.push(contents);
                cb();             
            } else {
                depFilename = contents.match(INLINE_REG)[3]; //依赖文件（模板文件）
                template = loadTemplate(depFilename);  // 通过绝对路径读到模板文件的内容
                compiled = vueCompiler.compile(template); // 编译模板文件
                contents = contents.replace(INLINE_REG, replacer); 

                // 模板编译发生错误
                if (compiled.errors.length > 0) {
                    throw compiled.errors;
                }

                this.push(contents);
                cb();
            }
        };

        // 返回transform object
        return through(transformFn, flushFn);
    }
};