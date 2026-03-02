const { spawnSync } = require('child_process');

const args = process.argv.slice(2);
const lifecycleGroups = ['start', 'stop', 'build', 'restart', 'setup'];

function parseNpmOriginalArgs() {
  const raw = process.env.npm_config_argv;
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.original)) {
      return parsed.original;
    }
  } catch {
  }

  return [];
}

function resolveInvocationArgs() {
  if (args.length > 0) {
    const lifecycle = (process.env.npm_lifecycle_event || '').trim().toLowerCase();
    if (lifecycleGroups.includes(lifecycle) && args[0] !== lifecycle) {
      return [lifecycle, ...args];
    }
    return args;
  }

  const lifecycle = (process.env.npm_lifecycle_event || '').trim().toLowerCase();
  const original = parseNpmOriginalArgs().map((value) => String(value).trim().toLowerCase());
  const firstArg = original[1];
  const secondArg = original[2];

  if (lifecycle === 'start') {
    if (original[0] === 'start' && firstArg) {
      return ['start', firstArg, secondArg];
    }
    return ['start', 'all'];
  }

  if (lifecycle === 'stop') {
    if (original[0] === 'stop' && firstArg) {
      return ['stop', firstArg];
    }
    return ['stop', 'all'];
  }

  if (lifecycle === 'build') {
    if (original[0] === 'build' && firstArg) {
      return ['build', firstArg, secondArg];
    }
    return ['build', 'all'];
  }

  if (lifecycle === 'restart') {
    if (original[0] === 'restart' && firstArg) {
      return ['restart', firstArg, secondArg];
    }
    return ['restart', 'all'];
  }

  if (lifecycle === 'setup') {
    if (original[0] === 'setup' && firstArg) {
      return ['setup', firstArg];
    }
    return ['setup', 'dev'];
  }

  return args;
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
    shell: false
  });

  if (result.error) {
    console.error(`[task-runner] Failed to run: ${command} ${commandArgs.join(' ')}`);
    console.error(result.error.message);
    process.exit(1);
  }

  process.exit(result.status ?? 1);
}

function runPowerShell(scriptPath, psArgs = []) {
  run('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-File',
    scriptPath,
    ...psArgs
  ]);
}

function runPowerShellInline(commandText) {
  run('powershell.exe', [
    '-NoProfile',
    '-ExecutionPolicy',
    'Bypass',
    '-Command',
    commandText
  ]);
}

function runCompose(fileName, action) {
  ensureDockerAvailable();

  const composeArgs = ['compose', '-f', fileName];

  if (action === 'up') {
    composeArgs.push('up', '-d', '--build');
  } else if (action === 'down') {
    composeArgs.push('down');
  } else if (action === 'logs') {
    composeArgs.push('logs', '-f', '--tail', '200');
  } else {
    console.error(`[task-runner] Unknown compose action: ${action}`);
    process.exit(1);
  }

  run('docker', composeArgs);
}

function runComposeService(action, serviceName) {
  ensureDockerAvailable();

  const composeArgs = ['compose'];

  if (action === 'up') {
    composeArgs.push('up', '-d', serviceName);
  } else if (action === 'down') {
    composeArgs.push('stop', serviceName);
  } else if (action === 'logs') {
    composeArgs.push('logs', '-f', '--tail', '200', serviceName);
  } else if (action === 'status') {
    composeArgs.push('ps', serviceName);
  } else {
    console.error(`[task-runner] Unknown compose service action: ${action}`);
    process.exit(1);
  }

  run('docker', composeArgs);
}

function ensureDockerAvailable() {
  const check = spawnSync('docker', ['--version'], {
    stdio: 'pipe',
    shell: false
  });

  if (check.error || check.status !== 0) {
    console.error('[task-runner] Docker is required for this command but is not available.');
    console.error('[task-runner] Start Docker Desktop, then run: npm run postgres:start');
    process.exit(1);
  }
}

function usage() {
  console.log(`Usage:
  npm start
  npm start backend
  npm stop backend
  npm build
  npm build auth
  npm setup dev
  npm restart auth
  npm run restart -- <all|backend|frontend|auth|user|approve|roles|inventory|gateway>
  npm run compose:app:up
  npm run compose:debug:up
  npm run postgres:start`);
}

const invocationArgs = resolveInvocationArgs();
const [group, sub, third] = invocationArgs;
const serviceTargets = ['auth', 'user', 'approve', 'roles', 'inventory', 'gateway'];

if (!group) {
  usage();
  process.exit(1);
}

if (group === 'launch') {
  if (sub === 'all') {
    runPowerShell('./launch.ps1');
  }
  if (sub === 'backend') {
    runPowerShell('./launch.ps1', ['backend']);
  }
  if (sub === 'frontend') {
    runPowerShell('./launch.ps1', ['frontend']);
  }
}

if (group === 'start') {
  if (!sub || sub === 'all') {
    runPowerShellInline("& './start-prereqs.ps1'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & './launch-backend.ps1' -AutoStartPostgres; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & './launch-frontend.ps1'; exit $LASTEXITCODE");
  }

  if (sub === 'backend') {
    runPowerShellInline("& './start-prereqs.ps1'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & './launch-backend.ps1' -AutoStartPostgres; exit $LASTEXITCODE");
  }

  if (sub === 'frontend') {
    runPowerShell('./launch.ps1', ['frontend']);
  }

  if (sub === 'service' && third) {
    if (third === 'roles') {
      runPowerShellInline("& './start-prereqs.ps1'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & './launch-backend.ps1' -Service 'roles' -AutoStartPostgres; exit $LASTEXITCODE");
    }

    const extra = third === 'roles' ? ['-AutoStartPostgres'] : [];
    runPowerShell('./launch-backend.ps1', ['-Service', third, ...extra]);
  }

  if (serviceTargets.includes(sub)) {
    if (sub === 'roles') {
      runPowerShellInline("& './start-prereqs.ps1'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & './launch-backend.ps1' -Service 'roles' -AutoStartPostgres; exit $LASTEXITCODE");
    }

    const extra = sub === 'roles' ? ['-AutoStartPostgres'] : [];
    runPowerShell('./launch-backend.ps1', ['-Service', sub, ...extra]);
  }

  usage();
  process.exit(1);
}

if (group === 'stop') {
  if (!sub || sub === 'all') {
    runPowerShellInline("& './stop-backend.ps1'; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; & './stop-frontend.ps1'; exit $LASTEXITCODE");
  }

  if (sub === 'backend') {
    runPowerShell('./stop-backend.ps1');
  }

  if (sub === 'frontend') {
    runPowerShell('./stop-frontend.ps1');
  }

  usage();
  process.exit(1);
}

if (group === 'setup' && sub === 'dev') {
  runPowerShell('./setup-dev.ps1');
}

if (group === 'build') {
  if (sub === 'all') {
    runPowerShell('./build.ps1');
  }
  if (sub === 'backend') {
    runPowerShell('./build.ps1', ['-BackendOnly']);
  }
  if (sub === 'frontend') {
    runPowerShell('./build.ps1', ['-FrontendOnly']);
  }
  if (sub === 'service' && third) {
    runPowerShell('./build.ps1', ['-Service', third]);
  }

  if (serviceTargets.includes(sub)) {
    runPowerShell('./build.ps1', ['-Service', sub]);
  }

  usage();
  process.exit(1);
}

if (group === 'restart') {
  const target = sub;
  if (!target || target === 'all') {
    runPowerShell('./restart.ps1', ['-Target', 'full']);
  }

  if (target === 'backend') {
    runPowerShell('./restart.ps1', ['-Target', 'backend']);
  }

  if (target === 'frontend') {
    runPowerShell('./restart.ps1', ['-Target', 'frontend']);
  }

  if (serviceTargets.includes(target)) {
    runPowerShell('./restart.ps1', ['-Target', 'service', '-Service', target]);
  }

  usage();
  process.exit(1);
}

if (group === 'check' && sub === 'backend') {
  runPowerShell('./check-backend.ps1');
}

if (group === 'compose') {
  if (sub === 'app') {
    runCompose('docker-compose.app.yml', third);
  }
  if (sub === 'debug') {
    runCompose('docker-compose.debug.yml', third);
  }
}

if (group === 'postgres') {
  if (sub === 'start') {
    runComposeService('up', 'postgres');
  }
  if (sub === 'stop') {
    runComposeService('down', 'postgres');
  }
  if (sub === 'logs') {
    runComposeService('logs', 'postgres');
  }
  if (sub === 'status') {
    runComposeService('status', 'postgres');
  }

  usage();
  process.exit(1);
}

usage();
process.exit(1);
