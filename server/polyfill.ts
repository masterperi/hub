const util = require('util');

if (!global.TextEncoder) {
    (global as any).TextEncoder = util.TextEncoder;
}
if (!global.TextDecoder) {
    (global as any).TextDecoder = util.TextDecoder;
}
if (!(globalThis as any).TextEncoder) {
    (globalThis as any).TextEncoder = util.TextEncoder;
}
if (!(globalThis as any).TextDecoder) {
    (globalThis as any).TextDecoder = util.TextDecoder;
}

console.log("✅ TextEncoder Polyfill Applied");
