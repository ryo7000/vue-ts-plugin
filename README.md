# TypeScript Language Service Plugin for Vue

WARNING: This plugin is in an alpha state. For a more polished
experience,
[try the VS Code plugin vetur](https://marketplace.visualstudio.com/items?itemName=octref.vetur).
This plugin, however, works with the Typescript language service. So
you can use it with whatever editor you want.

This plugin does three things for Javascript and Typescript source in a `.vue` file:

1. It uses `vue-template-compiler` to parse out the script section of a `.vue` file.
2. It wraps a default exported object literal in `new Vue(...)` in order to propagate the Vue contextual type so that no type annotations are needed.
3. It uses the Typescript language service to provide completions.

It also resolves `import other from "other.vue";` statements in the same manner.
It does *not* support completions in the `template` tag. It doesn't
even support the `template` or `style` tags.

## Features left to add

1. Recognise ES5-style `module.exports = { ...` in addition to ES6 `export default { ...`.
2. Recognise only lang="javascript", lang="typescript" and no lang attribute. Others should not turn on the language service.

## Instructions

1. `$ npm install ts-vue-plugin`
2. Add plugin to tsconfig.

```json
{
  compilerOptions: {
    "allowSyntheticDefaultImports": true,
    "plugins": [{ "name": "ts-vue-plugin" }]
  }
}
```

3. Run the **Select TypeScript version** command in VS Code to use the workspace version of TypeScript. You can find more information about managing typescript versions in the VS Code documentation.

For example, in Emacs, add the line:

```elisp
(add-to-list 'auto-mode-alist '("\\.vue$" . typescript-mode))
```

If you're Vim user, you can use [tsuquyomi-vue](https://github.com/Quramy/tsuquyomi-vue).

Now you have typescript support inside the script tags. HTML and CSS support are non-existent right now.
