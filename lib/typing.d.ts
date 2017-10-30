declare module 'vue-template-compiler' {
    export function parseComponent(text: string, option: {pad: string}): {
        script?: {
            content: string
        }
    }
}
