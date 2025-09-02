import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import css from "rollup-plugin-css-only";
import { terser } from "rollup-plugin-terser";

export default [
    {
<<<<<<< HEAD
        input: "src/index.js",
        output: [
            {
                file: "dist/commint.esm.js",
=======
        input: "index.js",
        output: [
            {
                file: "plugin.esm.js",
>>>>>>> 6b46255 (tiles)
                format: "esm",
                sourcemap: true,
            },
            {
<<<<<<< HEAD
                file: "dist/commint.js",
=======
                file: "plugin.js",
>>>>>>> 6b46255 (tiles)
                format: "iife",
                name: "Commint",
                sourcemap: true,
            },
        ],
        plugins: [
            resolve(),
            commonjs(),
            css({ output: "bundle.css" }) /*terser()*/,
        ],
    },
];
