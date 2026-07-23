import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const scriptName = process.argv[2];
const scriptArgs = process.argv.slice(3);

if (!scriptName) {
  console.error('Usage: node tools/run-powershell.mjs <script.ps1> [...args]');
  process.exit(1);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const scriptPath = path.resolve(root, scriptName);

if (!existsSync(scriptPath)) {
  console.error(`PowerShell script not found: ${scriptPath}`);
  process.exit(1);
}

const shell = process.platform === 'win32' ? 'powershell.exe' : 'pwsh';
const args = ['-NoProfile'];

if (process.platform === 'win32') {
  args.push('-ExecutionPolicy', 'Bypass');
}

args.push('-File', scriptPath, ...scriptArgs);

const child = spawn(shell, args, {
  cwd: root,
  stdio: 'inherit',
  windowsHide: false,
});

child.on('error', (error) => {
  const installHint = process.platform === 'win32'
    ? 'Could not start Windows PowerShell. Make sure powershell.exe is available in PATH.'
    : 'Could not start PowerShell Core. Install pwsh on Linux before running this script.';

  console.error(`${installHint}\n${error.message}`);
  process.exit(1);
});

child.on('exit', (code, signal) => {
  if (signal) {
    console.error(`PowerShell script exited with signal ${signal}.`);
    process.exit(1);
  }

  process.exit(code ?? 0);
});
