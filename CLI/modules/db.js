const path = require("path")
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })

const util = require('util');
const exec = util.promisify(require('child_process').exec);
const replace = require('replace-in-file');

function randomString(length) {
  let result = '';
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxy';
  const charactersLength = characters.length;
  let counter = 0;
  while (counter < length) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
    counter += 1;
  }
  return result;
}

const createServiceDB = async (service_name) => {
  const dbUser = randomString(10).toLowerCase()
  const dbPassword = randomString(32)

  const dbUserInjection = `SERVICE_${service_name.toUpperCase()}_DB_USER=${dbUser}`
  const dbPasswordInjection = `SERVICE_${service_name.toUpperCase()}_DB_PASSWORD=${dbPassword}`
  const dbUrlInjection = `SERVICE_${service_name.toUpperCase()}_DB_URL=postgresql://${dbUser}:${dbPassword}@localhost:${process.env.POSTGRES_PORT}/${service_name}?schema=public`

  await replace({
    files: `${process.env.ENV_PATH}/.env`,
    from: /(### SERVICES CREDENTIALS ###)/gm,
    to: `### SERVICES CREDENTIALS ###\n${dbUserInjection}\n${dbPasswordInjection}\n${dbUrlInjection}`
  })

  // USER CREATION
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d master -c "create user ${dbUser} with encrypted password '${dbPassword}';"`)
  // DB CREATION
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d master -c "CREATE DATABASE ${service_name} WITH OWNER = ${dbUser} ENCODING 'UTF8' LC_COLLATE 'en_US.utf8' LC_CTYPE 'en_US.utf8';"`)
  // GRANT PRIVILEGES
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d master -c "GRANT ALL PRIVILEGES ON DATABASE ${service_name} to ${dbUser};"`)
  // CREATEDB USER
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d master -c "ALTER USER ${dbUser} CREATEDB;"`)
  // ALTER PRIVILEGES
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d ${service_name} -c "ALTER DEFAULT PRIVILEGES FOR USER ${dbUser} IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${dbUser};"`)
}

const deleteServiceDB = async (service_db, user_db) => {
  // DELETE DB
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d master -c "DROP DATABASE ${service_db} WITH (FORCE);"`)
  // DELETE USER
  await exec(`docker exec "${process.env.DOCKER_CONTAINER}" psql -U ${process.env.POSTGRES_USER} -d master -c "drop user ${user_db};"`)
}

const migrateDB = async (service_name) => {
  const { spawn } = require('child_process')
  spawn(`cd ${process.env.SERVICES_PATH}/${service_name}/model && dotenv -e ${process.env.ENV_PATH}/.env -- npx prisma migrate dev`,[], { stdio: 'inherit', shell: true })
}

module.exports = { createServiceDB, deleteServiceDB, migrateDB }