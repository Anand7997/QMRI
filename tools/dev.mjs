import { spawn } from 'node:child_process';
import process from 'node:process';

const commands = [
  {
    name: 'backend',
    command: 'dotnet run --project backend/src/qMRI.Api/qMRI.Api.csproj --launch-profile http',
    env: {
      ASPNETCORE_ENVIRONMENT: 'Development',
    },
  },
  {
    name: 'frontend',
    command: 'npm --prefix frontend run dev',
  },
];

let stopping = false;
let exitCode = 0;

const children = commands.map((entry) => {
  const child = spawn(entry.command, {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...entry.env,
    },
    shell: true,
    windowsHide: true,
    stdio: ['inherit', 'pipe', 'pipe'],
  });

  child.stdout.on('data', (chunk) => writePrefixed(entry.name, chunk));
  child.stderr.on('data', (chunk) => writePrefixed(entry.name, chunk, true));

  child.on('error', (error) => {
    exitCode = 1;
    console.error(`[${entry.name}] failed to start: ${error.message}`);
    stopAll();
  });

  child.on('exit', (code, signal) => {
    if (!stopping && code !== 0) {
      exitCode = code ?? 1;
      console.error(`[${entry.name}] exited with ${signal ?? `code ${code}`}`);
      stopAll();
    }

    if (children.every((item) => item.exitCode !== null || item.signalCode !== null)) {
      process.exit(exitCode);
    }
  });

  return child;
});

console.log('qMRI dev servers starting...');
console.log('Backend:  http://44.216.167.20:6000');
console.log('Frontend: http://44.216.167.20:8085');
console.log('Press Ctrl+C to stop both.');

process.on('SIGINT', () => {
  exitCode = 0;
  stopAll();
});

process.on('SIGTERM', () => {
  exitCode = 0;
  stopAll();
});

function stopAll() {
  if (stopping) {
    return;
  }

  stopping = true;
  console.log('Stopping qMRI dev servers...');

  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) {
      child.kill();
    }
  }
}

function writePrefixed(name, chunk, isError = false) {
  const stream = isError ? process.stderr : process.stdout;
  const text = chunk.toString();
  const lines = text.split(/\r?\n/);

  for (const line of lines) {
    if (line.length > 0) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
}
