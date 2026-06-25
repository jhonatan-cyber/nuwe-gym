import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import net from 'node:net';

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
};

function log(message: string, type: 'info' | 'success' | 'warn' | 'error' | 'title' = 'info') {
  switch (type) {
    case 'title':
      console.log(`\n${colors.bright}${colors.cyan}=== ${message} ===${colors.reset}\n`);
      break;
    case 'success':
      console.log(`${colors.green}✔ ${message}${colors.reset}`);
      break;
    case 'warn':
      console.log(`${colors.yellow}⚠ ${message}${colors.reset}`);
      break;
    case 'error':
      console.log(`${colors.red}✖ ${message}${colors.reset}`);
      break;
    default:
      console.log(`${colors.reset}ℹ ${message}`);
  }
}

async function checkPort(port: number, host: string): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    const onError = () => {
      socket.destroy();
      resolve(false);
    };
    socket.setTimeout(1000);
    socket.once('error', onError);
    socket.once('timeout', onError);
    socket.connect(port, host, () => {
      socket.end();
      resolve(true);
    });
  });
}

function runCommand(command: string, stdio: 'inherit' | 'pipe' = 'inherit'): boolean {
  try {
    execSync(command, { stdio });
    return true;
  } catch (error) {
    return false;
  }
}

async function main() {
  log('GymManager - Setup Automatizado del Entorno', 'title');

  const rootDir = path.resolve(__dirname, '..');
  const envExamplePath = path.join(rootDir, '.env.example');
  const envLocalPath = path.join(rootDir, '.env.local');

  // 1. Configurar archivo .env.local
  if (!fs.existsSync(envLocalPath)) {
    log('Creando archivo .env.local desde .env.example...', 'info');
    try {
      fs.copyFileSync(envExamplePath, envLocalPath);
      log('.env.local creado con éxito.', 'success');
    } catch (err: any) {
      log(`No se pudo copiar .env.local: ${err.message}`, 'error');
      process.exit(1);
    }
  } else {
    log('El archivo .env.local ya existe.', 'success');
  }

  // Leer variables de entorno de .env.local
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const dbUrlMatch = envContent.match(/^DATABASE_URL\s*=\s*(.+)$/m);
  
  let dbUrl = 'postgresql://postgres:Ancasi96nuwe%2B@localhost:5432/gymmanager';
  if (dbUrlMatch) {
    dbUrl = dbUrlMatch[1].trim().replace(/['"]/g, '');
  }

  // Parsear URL de la base de datos
  let dbHost = 'localhost';
  let dbPort = 5432;
  try {
    const parsedUrl = new URL(dbUrl);
    dbHost = parsedUrl.hostname || 'localhost';
    dbPort = parsedUrl.port ? parseInt(parsedUrl.port, 10) : 5432;
  } catch (err) {
    log('No se pudo parsear DATABASE_URL del .env.local. Usando valores por defecto.', 'warn');
  }

  log(`Destino de base de datos: ${dbHost}:${dbPort}`, 'info');

  // 2. Verificar si el puerto ya responde (DB externa o local ya activa)
  const dbReady = await checkPort(dbPort, dbHost);

  if (dbReady) {
    log('Se detectó una instancia de base de datos activa y respondiendo.', 'success');
  } else {
    log('No se detectó base de datos en el puerto indicado.', 'error');
    log('Asegurate de tener PostgreSQL corriendo localmente y configurado en .env.local', 'warn');
    process.exit(1);
  }

  // 3. Ejecutar Drizzle Kit Push
  log('Sincronizando el esquema con la base de datos (drizzle-kit push)...', 'info');
  
  let pushSuccess = false;
  let pushAttempts = 0;
  while (pushAttempts < 3 && !pushSuccess) {
    pushSuccess = runCommand('bun run db:push');
    if (!pushSuccess) {
      pushAttempts++;
      if (pushAttempts < 3) {
        log('Reintentando drizzle-kit push en 3 segundos...', 'warn');
        await new Promise((r) => setTimeout(r, 3000));
      }
    }
  }

  if (pushSuccess) {
    log('Esquema de base de datos sincronizado con éxito.', 'success');
  } else {
    log('No se pudo sincronizar el esquema de la base de datos. Verifica la conexión.', 'error');
    process.exit(1);
  }

  // 4. Ejecutar Seed para el usuario Admin por defecto
  log('Insertando datos de prueba (seed)...', 'info');
  const seedSuccess = runCommand('bun run db:seed');
  
  if (seedSuccess) {
    log('Datos de semilla (Seed) insertados con éxito.', 'success');
  } else {
    log('El seed falló o ya se había ejecutado previamente.', 'warn');
  }

  log('¡Levantamiento optimizado completado con éxito!', 'success');
  log('Ahora puedes correr "bun run dev" para iniciar la aplicación.', 'info');
  
  process.exit(0);
}

main().catch((err) => {
  log(`Error inesperado durante el setup: ${err.message}`, 'error');
  process.exit(1);
});
