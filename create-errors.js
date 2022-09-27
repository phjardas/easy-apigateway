/* eslint-disable @typescript-eslint/no-var-requires */
const { StatusCodes, getReasonPhrase } = require("http-status-codes");
const { writeFile } = require("fs/promises");
const { format } = require("prettier");

function functionName(text) {
  const name = text.replace(/[\s\-']/g, "").replace(/Error$/, "") + "Error";
  return name.charAt(0).toLowerCase() + name.substring(1);
}

async function main() {
  const code = [
    "// This file is generated, do not edit!\n// node create-errors.js",
    'import { statusErrorFactory } from "./error";',
    ...Object.keys(StatusCodes)
      .filter((e) => e.length === 3)
      .map(
        (code) =>
          `export const ${functionName(
            getReasonPhrase(code)
          )} = statusErrorFactory(${code}, "${getReasonPhrase(code)}");`
      ),
  ].join("\n");

  const formatted = format(code, {
    parser: "typescript",
    filepath: "src/errors.ts",
  });

  await writeFile("src/errors.ts", formatted, "utf-8");
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
