/*!
 * fis3-preprocessor-vueTmpl
 * copyright 2016 Hiufan Zheng
 * email: Hiufan@qq.com
 * Released under the MIT License.
 */
'use strict';

var fs = require('fs');
var path = require('path');
var vueCompiler = require('vue-template-compiler');
var transpile = require('vue-template-es2015-compiler');
var detective = require('detective');
var Transform = require('stream').Transform;

function toFunction(code) {
    return transpile('function render () {' + code + '}');
};

module.exports = function (file) {
    return function (inputFileRealPath) {
        var data = [];
        var _transform = function(chunk, encoding, cb){
            data.push(chunk);
            cb && cb();
        };

        var _flush = function(cb) {
            var tmpl = null; // 用于保存模板内容

            var getDeps = function (){
                var deps = detective(data, {
                    word: '__inline'
                });

                if (deps.length === 0) return null;

                return deps;
            };

            var processDeps = function () {
                var inputDirname = fis.util.pathinfo(inputFileRealPath).dirname;
                var deps = getDeps();

                if (!deps) return;

                deps.forEach(function (filename) {
                    var filePath = path.resolve(inputDirname, filename);
                    tmpl = fs.readFileSync(filePath, 'utf-8');
                    // 添加依赖，依赖将会被用来判断缓存是否有效
                    file.cache.addDeps(filePath);
                });
            };

            var replacer = function (tmpl, content) {
                var reg = /(\/\/[^\r\n\f]+|\/\*[\s\S]*?(?:\*\/|$))|(\btemplate\s*:\s*.*\)([,]*))/;
                return content.replace(reg, function(m, $1, $2, $3){
                    var compiled = null;

                    if ($2) {
                        compiled = vueCompiler.compile(tmpl);
                        m = 'render : ' + toFunction(compiled.render) + ','
                            + 'staticRenderFns: [' + compiled.staticRenderFns.map(toFunction).join(',') + ']' + $3;
                    }

                    return m;
                });
            };

            processDeps();

            var inputFile = fis.file.wrap(inputFileRealPath);

            var content = new Buffer.concat(data).toString('utf8');
            
            if (tmpl) {
                content = replacer(tmpl, content);
            }

            // 处理html之外的内置语法
            content = fis.compile.partial(content, inputFile, {
                ext: 'js'
            });

            this.push(content);

            cb();
        };

        var tr = new Transform({
            transform: _transform,
            flush: _flush
        });

        return tr;
    }
};