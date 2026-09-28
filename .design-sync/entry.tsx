// Bundle entry for design-sync. The synth-entry `export *` skips default
// exports, and Window is a default export — re-export it as a named binding
// so it lands on window.DS.Window.
export { default as Window } from "../components/window/Window";
