import { execSync } from 'child_process'

export const runMigrations = async () => {
  try {
    console.log('🔄 Ejecutando migraciones pendientes...')
    execSync('npx prisma migrate deploy', { stdio: 'inherit' })
    console.log('✅ Migraciones aplicadas correctamente')
  } catch (error) {
    console.error('❌ Error al ejecutar migraciones:', error)
    throw error
  }
}