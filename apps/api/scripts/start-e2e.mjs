#!/usr/bin/env node
/**
 * Start Django server for E2E tests with database setup.
 * Cross-platform script that runs migrations, seeds admin, and starts server.
 */
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const API_DIR = join(__dirname, '..');

function runCommand(args, description) {
  return new Promise((resolve, reject) => {
    console.error(`[API Setup] ${description}...`);
    const proc = spawn('uv', ['run', 'python', 'manage.py', ...args], {
      cwd: API_DIR,
      stdio: ['ignore', 'pipe', 'pipe'],
      shell: true,
    });

    let stdout = '';
    let stderr = '';

    proc.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      console.error(`[API Setup] ${text}`);
    });

    proc.stderr?.on('data', (data) => {
      const text = data.toString();
      stderr += text;
      console.error(`[API Setup] ${text}`);
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        console.error(
          `[API Setup] ${description} failed with exit code ${code}`,
        );
        if (stderr) console.error(`[API Setup] stderr: ${stderr}`);
        reject(new Error(`${description} failed`));
      }
    });

    proc.on('error', (err) => {
      console.error(`[API Setup] Error running ${description}:`, err);
      reject(err);
    });
  });
}

async function checkDatabase() {
  return new Promise((resolve) => {
    const proc = spawn(
      'uv',
      ['run', 'python', 'manage.py', 'check', '--database', 'default'],
      {
        cwd: API_DIR,
        stdio: 'pipe',
        shell: true,
      },
    );

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', () => {
      resolve(false);
    });

    // Timeout after 5 seconds
    setTimeout(() => {
      proc.kill();
      resolve(false);
    }, 5000);
  });
}

async function waitForDatabase(maxAttempts = 30) {
  console.error('[API Setup] Waiting for database to be ready...');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (await checkDatabase()) {
      console.error('[API Setup] Database is ready!');
      return true;
    }
    if (attempt < maxAttempts - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  console.error(
    '[API Setup] Warning: Database might not be ready, but continuing...',
  );
  return false;
}

async function main() {
  try {
    console.error('[API Setup] Starting API server for E2E tests...');

    // Wait for database
    await waitForDatabase();

    // Run migrations (don't fail if it errors)
    try {
      await runCommand(['migrate', '--noinput'], 'Running migrations');
    } catch (err) {
      console.error('[API Setup] Migration failed, but continuing...');
    }

    // Seed admin user (don't fail if it errors)
    try {
      await runCommand(['seed_admin'], 'Seeding admin user');
    } catch (err) {
      console.error('[API Setup] Seed failed, but continuing...');
    }

    // Start the server (this will run indefinitely)
    console.error('[API Setup] Starting Django development server...');
    const server = spawn(
      'uv',
      ['run', 'python', 'manage.py', 'runserver', '0.0.0.0:8000'],
      {
        cwd: API_DIR,
        stdio: 'inherit',
        shell: true,
      },
    );

    server.on('error', (err) => {
      console.error('[API Setup] Error starting server:', err);
      process.exit(1);
    });

    server.on('exit', (code) => {
      if (code !== null && code !== 0) {
        console.error(`[API Setup] Server exited with code ${code}`);
        process.exit(code);
      }
    });

    process.on('SIGINT', () => {
      server.kill('SIGINT');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      server.kill('SIGTERM');
      process.exit(0);
    });
  } catch (err) {
    console.error('[API Setup] Fatal error:', err);
    process.exit(1);
  }
}

main();
