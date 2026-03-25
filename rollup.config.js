"use strict";

import clear from 'rollup-plugin-clear';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import screeps from 'rollup-plugin-screeps';

let cfg;
const dest = process.env.DEST;
if (!dest) {
  console.log("No destination specified - code will be compiled but not uploaded");
} else if ((cfg = require("./screeps.json")[dest]) == null) {
  throw new Error("Invalid upload destination");
}

if(cfg)
{
  console.log(`Config: ${JSON.stringify(cfg)}`);

  const envRegex = /\$\{([A-Z_]+)\}/;
  for(let key of Object.keys(cfg))
  {
    console.log(`Checking ${key} of config for Environment variables`);
    let val = cfg[key];
    console.log(`Val is: ${typeof(val)}`)
    if(typeof(val) === "string")
    {
      let match = val.match(envRegex);
      if(match)
      {
        console.log(`Potential Environment variable found`);
        let envKey = match[1];
        console.log(`Match: ${JSON.stringify(match)}`);
        console.log(`Envrionment Variable: (${envKey})`);
        if(process.env[envKey])
        {
          console.log(`Replacing (${cfg[key]}) with Environment Variable (${envKey})`);
          cfg[key] = process.env[envKey];
        }
      }
    }
    //Depth?
  }
}

export default {
  input: "src/main.ts",
  output: {
    file: "dist/main.js",
    format: "cjs",
    sourcemap: true
  },

  plugins: [
    clear({ targets: ["dist"] }),
    resolve({ rootDir: "src" }),
    commonjs(),
    typescript({tsconfig: "./tsconfig.json"}),
    screeps({config: cfg, dryRun: cfg == null})
  ]
}
