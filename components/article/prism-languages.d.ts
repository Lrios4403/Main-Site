// Prism grammars that react-syntax-highlighter ships but @types/react-syntax-highlighter
// doesn't declare yet. An ambient file (no imports): inside a module, `declare module`
// would be an augmentation, which an untyped module can't have.
declare module "react-syntax-highlighter/dist/esm/languages/prism/wgsl" {
  const language: unknown;
  export default language;
}
