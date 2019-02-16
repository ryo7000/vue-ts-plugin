"use strict";
const vue_template_compiler_1 = require("vue-template-compiler");
const path = require("path");
function isVue(filename) {
    return path.extname(filename) === '.vue';
}
function isVueProject(path) {
    return path.endsWith('.vue.ts') && !path.includes('node_modules');
}
function parse(text) {
    const output = vue_template_compiler_1.parseComponent(text, { pad: "space" });
    return output && output.script && output.script.content || 'export default {}';
}
function init({ typescript: ts }) {
    return { create, getExternalFiles };
    function create(info) {
        changeSourceFiles(info);
        const compilerOptions = info.languageServiceHost.getCompilationSettings();
        info.languageServiceHost.resolveModuleNames = resolveModuleNames;
        const vueSys = Object.assign({}, ts.sys, { fileExists(path) {
                if (isVueProject(path)) {
                    return ts.sys.fileExists(path.slice(0, -3));
                }
                return ts.sys.fileExists(path);
            },
            readFile(path, encoding) {
                if (isVueProject(path)) {
                    const fileText = ts.sys.readFile(path.slice(0, -3), encoding);
                    return fileText ? parse(fileText) : fileText;
                }
                else {
                    const fileText = ts.sys.readFile(path, encoding);
                    return fileText;
                }
            } });
        function resolveModuleNames(moduleNames, containingFile) {
            // in the normal case, delegate to ts.resolveModuleName
            // in the relative-imported.vue case, manually build a resolved filename
            return moduleNames.map(name => {
                if (path.isAbsolute(name) || !isVue(name)) {
                    return ts.resolveModuleName(name, containingFile, compilerOptions, ts.sys).resolvedModule;
                }
                const resolved = ts.resolveModuleName(name, containingFile, compilerOptions, vueSys).resolvedModule;
                if (!resolved) {
                    return undefined;
                }
                if (!resolved.resolvedFileName.endsWith('.vue.ts')) {
                    return resolved;
                }
                const resolvedFileName = resolved.resolvedFileName.slice(0, -3);
                const extension = ts.Extension.Ts;
                return { resolvedFileName, extension };
            });
        }
        return info.languageService;
    }
    function changeSourceFiles(info) {
        const clssf = ts.createLanguageServiceSourceFile;
        const ulssf = ts.updateLanguageServiceSourceFile;
        function createLanguageServiceSourceFile(fileName, scriptSnapshot, scriptTarget, version, setNodeParents, scriptKind, cheat) {
            if (interested(fileName)) {
                const wrapped = scriptSnapshot;
                scriptSnapshot = {
                    getChangeRange: old => wrapped.getChangeRange(old),
                    getLength: () => wrapped.getLength(),
                    getText: (start, end) => parse(wrapped.getText(0, wrapped.getLength())).slice(start, end),
                };
            }
            var sourceFile = clssf(fileName, scriptSnapshot, scriptTarget, version, setNodeParents, scriptKind);
            if (interested(fileName)) {
                modifyVueSource(sourceFile);
            }
            return sourceFile;
        }
        function updateLanguageServiceSourceFile(sourceFile, scriptSnapshot, version, textChangeRange, aggressiveChecks, cheat) {
            if (interested(sourceFile.fileName)) {
                const wrapped = scriptSnapshot;
                scriptSnapshot = {
                    getChangeRange: old => wrapped.getChangeRange(old),
                    getLength: () => wrapped.getLength(),
                    getText: (start, end) => parse(wrapped.getText(0, wrapped.getLength())).slice(start, end),
                };
            }
            var sourceFile = ulssf(sourceFile, scriptSnapshot, version, textChangeRange, aggressiveChecks);
            if (interested(sourceFile.fileName)) {
                modifyVueSource(sourceFile);
            }
            return sourceFile;
        }
        ts.createLanguageServiceSourceFile = createLanguageServiceSourceFile;
        ts.updateLanguageServiceSourceFile = updateLanguageServiceSourceFile;
    }
    function interested(filename) {
        return filename.slice(filename.lastIndexOf('.')) === ".vue";
    }
    function importInterested(filename) {
        return interested(filename) && filename.slice(0, 2) === "./";
    }
    /** Works like Array.prototype.find, returning `undefined` if no element satisfying the predicate is found. */
    function find(array, predicate) {
        for (let i = 0; i < array.length; i++) {
            const value = array[i];
            if (predicate(value, i)) {
                return value;
            }
        }
        return undefined;
    }
    function modifyVueSource(sourceFile) {
        // 1. add `import Vue from './vue'
        // 2. find the export default and wrap it in `new Vue(...)` if it exists and is an object literal
        //logger.info(sourceFile.getStart() + "-" + sourceFile.getEnd());
        const statements = sourceFile.statements;
        const exportDefaultObject = find(statements, st => st.kind === ts.SyntaxKind.ExportAssignment &&
            st.expression.kind === ts.SyntaxKind.ObjectLiteralExpression);
        var b = (n) => ts.setTextRange(n, { pos: 0, end: 0 });
        if (exportDefaultObject) {
            //logger.info(exportDefaultObject.toString());
            const vueImport = b(ts.createImportDeclaration(undefined, undefined, b(ts.createImportClause(b(ts.createIdentifier("Vue")), undefined)), b(ts.createLiteral("vue"))));
            statements.unshift(vueImport);
            const obj = exportDefaultObject.expression;
            exportDefaultObject.expression = ts.setTextRange(ts.createNew(ts.setTextRange(ts.createIdentifier("Vue"), { pos: obj.pos, end: obj.pos + 1 }), undefined, [obj]), obj);
            ts.setTextRange(exportDefaultObject.expression.arguments, obj);
        }
    }
    function getExternalFiles(project) {
        const result = project.getFileNames().filter(interested);
        project.projectService.openFiles.forEach((path, filename) => {
            if (interested(filename)) {
                result.push(ts.server.toNormalizedPath(filename));
            }
        });
        return result;
    }
}
module.exports = init;
