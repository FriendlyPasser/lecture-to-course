const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const rootDir = path.resolve(__dirname, '..');
const localDir = path.join(rootDir, '.local');
const [command, ...args] = process.argv.slice(2);
const env = {
  ...process.env,
  PLAYWRIGHT_BROWSERS_PATH:
    process.env.PLAYWRIGHT_BROWSERS_PATH ?? path.join(localDir, 'cache/playwright'),
};

function run(cliPath, cliArgs) {
  const result = spawnSync(process.execPath, [cliPath, ...cliArgs], {
    cwd: rootDir,
    env,
    stdio: 'inherit',
  });
  if (result.error) throw result.error;
  process.exitCode = result.status ?? 1;
}

function main() {
  if (command === 'setup') {
    if (!process.env.npm_execpath) {
      throw new Error('Run npm run setup to install development dependencies.');
    }
    fs.mkdirSync(localDir, { recursive: true });
    for (const filename of ['package.json', 'package-lock.json']) {
      fs.copyFileSync(path.join(rootDir, filename), path.join(localDir, filename));
    }
    run(process.env.npm_execpath, [
      'ci',
      '--prefix',
      localDir,
      '--cache',
      path.join(localDir, 'cache/npm'),
      ...args,
    ]);
    return;
  }

  const cliPaths = {
    prettier: 'prettier/bin/prettier.cjs',
    playwright: 'playwright/cli.js',
  };
  if (!Object.hasOwn(cliPaths, command)) {
    throw new Error('Usage: node scripts/dev.cjs <setup|prettier|playwright> [arguments]');
  }
  const cliPath = path.join(localDir, 'node_modules', cliPaths[command]);
  if (!fs.existsSync(cliPath)) {
    throw new Error('Development dependencies are missing. Run npm run setup first.');
  }
  run(cliPath, args);
}

try {
  main();
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
