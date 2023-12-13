/* eslint-disable @typescript-eslint/no-var-requires */
const fetch = require("node-fetch");
const { promises: fs } = require("fs");
const prettier = require("prettier");

function functionName({ text }) {
  const name =
    text
      .replace(/[\s-]/g, "")
      .replace(/^HTTP/, "http")
      .replace(/Error$/, "") + "Error";

  return name.charAt(0).toLowerCase() + name.substring(1);
}

async function main() {
  const response = await fetch(
    "https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html",
  );
  const html = await response.text();
  const errors = html
    .split(/\n/g)
    .filter((line) => line.includes("<h3>"))
    .map((line) => {
      const match = /.*(\d{3})\s+(.+)<\/h3>.*/.exec(line);
      if (match) return { status: parseInt(match[1], 10), text: match[2] };
    })
    .filter(Boolean)
    .filter(({ status, text }) => status >= 300 && text !== "(Unused)");

  const code = [
    "// This file is generated, do not edit!",
    "// node create-errors.js\n",
    'import { StatusError } from "./error";\n',
    ...errors.map(
      (error) =>
        `export function ${functionName(error)}(message = "${
          error.text
        }"): StatusError {\n  return new StatusError(${
          error.status
        }, message);\n}\n`,
    ),
  ].join("\n");

  const formatted = await prettier.format(code, { filepath: "src/errors.ts" });
  await fs.writeFile("src/errors.ts", formatted, "utf-8");
}

main().catch((error) => {
  process.exitCode = 1;
  console.error(error);
});
