import { spawn } from "node:child_process";

const commands = [
  ["server", "node", ["server/src/index.js"]],
  ["client", "npx", ["vite", "client", "--host", "127.0.0.1"]]
];

const children = commands.map(([name, command, args]) => {
  const child = process.platform === "win32"
    ? spawn("cmd.exe", ["/c", command, ...args], { stdio: "pipe" })
    : spawn(command, args, { stdio: "pipe" });
  child.stdout.on("data", (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on("data", (data) => process.stderr.write(`[${name}] ${data}`));
  child.on("exit", (code) => {
    if (code && code !== 0) process.exitCode = code;
  });
  return child;
});

const shutdown = () => {
  for (const child of children) child.kill();
  process.exit();
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
