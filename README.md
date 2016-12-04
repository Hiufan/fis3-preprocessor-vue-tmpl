# fis3-preprocessor-vue-tmpl

    Note: 仅支持在fis3中使用，不支持`.vue`形式的单文件

## 功能说明
`fis3-preprocessor-vue-tmpl`是一款用于在fis3构建时对vue2.0的模板进行编译的插件，支持的特性包括：

- commonjs方式引用js模块
- babel解析ES2015语法
- 直接引用npm/bower模块
- 构建时预编译vue2.0的模板为`Render函数`
- 保持对fis3内置语法（`__inline`/`__uri()`）的支持

## 特性描述
由于vue2.0支持[独立构建与运行时构建](https://vuejs.org/v2/guide/installation.html#Standalone-vs-Runtime-only-Build)，因此采用`Runtime-only build`可以减少运行时的代码体积。

然而，使用这种方式并不支持`template`属性，仅能对单文件中的模板进行编译，或者就是直接写渲染函数。

当我们使用fis3时，会直接在`xxx.html`中写模板，并使用`template: __inline('xxx.html')`这样的方式来引用模板，从而让代码量较多的组件可以合理地组织三种资源（html/css/js）。与直接写渲染函数相比，贴近HTML的模板语法，可读性更友好一些。

从渲染的过程来看，无论`template`属性中引用的模板代码，抑或是单文件(.vue)中的模板最终都会被vue的编译器编译为[`Render函数`](https://vuejs.org/v2/guide/render-function.html#Template-Compilation)，再渲染为`virtual dom`，我们因此可以将模板编译的过程提前到构建阶段，这样就可以减少运行时编译所产生的耗时。

这个插件本质上是将fis3的`__inline()`语法替换为`Vue.compile`，既保持开发时贴近HTML的模板语法，又在构建时就完成了模板的编译。

## 安装
局部安装
```bash
npm install fis3-preprocessor-vue-tmpl --save-dev
``` 
全局安装
```bash
npm install fis3-preprocessor-vue-tmpl -g
```

## 使用

```js
//fis-conf.js

fis.config.set('settings.preprocessor.browserify', {
    browserify: {
        // debug: true,
    },
    es2015: {
        enable: true,
        presets: ['es2015','react', 'stage-2']
    }
});

```

-	其中`browserify`中的配置与[browserify opts](https://github.com/substack/node-browserify#browserifyfiles--opts)保持一致。
- 若要启用es2015支持，需要将es2015选项中的`enaable`属性配置为`true`，`presets`属性才会生效。

