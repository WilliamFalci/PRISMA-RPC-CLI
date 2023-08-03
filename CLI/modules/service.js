const path = require("path")
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })

const fs = require("fs");
const fsPromises = require("fs").promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const replace = require('replace-in-file');
const prompt = require("prompt-sync")({ sigint: true });

const { createServiceDB, deleteServiceDB} = require('./db');
const { createServiceRouter } = require("./router");

const askConfirmation = async (message) => {
  const answer = await prompt(message);
  return answer.toLocaleLowerCase()
}

const createService = async (service_name) => {
  if (!fs.existsSync(`${process.env.SERVICES_PATH}/${service_name}`)) {

    // CREATE SERVICE FOLDERS
    await fsPromises.mkdir(`${process.env.SERVICES_PATH}/${service_name}`);
    await fsPromises.mkdir(`${process.env.SERVICES_PATH}/${service_name}/microservices`);
    await fsPromises.mkdir(`${process.env.SERVICES_PATH}/${service_name}/model`);

    // CREATE SERVICE ROUTER
    await createServiceRouter(service_name)

    // INIT PRISMA
    await exec(`cd ${process.env.SERVICES_PATH}/${service_name}/model && npx prisma init && rm ./.env`)

    await replace({
      files: `${process.env.SERVICES_PATH}/${service_name}/model/prisma/schema.prisma`,
      from: /(DATABASE_URL)/gm,
      to: `SERVICE_${service_name.toUpperCase()}_DB_URL`
    })

    await replace({
      files: `${process.env.SERVICES_PATH}/${service_name}/model/prisma/schema.prisma`,
      from: /(prisma-client-js)/gm,
      to: `provider = "prisma-client-js"\n\toutput   = "../../interface"`
    })

    // INIT CREDENTIALS
    await createServiceDB(service_name)
  }else{
    console.log('Service Already Exist')
  }
}

const deleteService = async (service_name) => {
  let answer = await askConfirmation(`Are you sure to delete ${service_name}'s service?[y/n] `);
  switch(answer){
    case 'y':
      // Delete Router Injection
      const routerRequireRegex = new RegExp(`(.*\.\/services\/${service_name.toUpperCase()}\/.*)`,'gm')
      const routerInjectionRegex = new RegExp(`(.*${service_name.toUpperCase()}?: ${service_name.toUpperCase()}.*)`,'gm')
      await replace({ files: `${process.env.ENV_PATH}/.env`, from: routerRequireRegex, to: ''})
      await replace({ files: `${process.env.ENV_PATH}/.env`, from: routerInjectionRegex, to: ''})

      // Delete Service Path
      fs.rmSync(`${process.env.SERVICES_PATH}/${service_name}`, { recursive: true, force: true });

      // Delete DB User And Database
      await deleteServiceDB(service_name,process.env[`SERVICE_${service_name.toUpperCase()}_DB_USER`])

      // Delete DB Credentials from ENV
      const dbUserRegex = new RegExp(`(SERVICE_${service_name.toUpperCase()}_DB_USER.*)`, "gm");
      const dbPasswordRegex = new RegExp(`(SERVICE_${service_name.toUpperCase()}_DB_PASSWORD.*)`, "gm");
      const dbUrlRegex = new RegExp(`(SERVICE_${service_name.toUpperCase()}_DB_URL.*)`, "gm");

      await replace({ files: `${process.env.ENV_PATH}/.env`, from: dbUserRegex, to: ''})
      await replace({ files: `${process.env.ENV_PATH}/.env`, from: dbPasswordRegex, to: ''})
      await replace({ files: `${process.env.ENV_PATH}/.env`, from: dbUrlRegex, to: ''})
      await replace({ files: `${process.env.ENV_PATH}/.env`, from: /[\n]+/gm, to: '\n'})
      break;
    default:
      console.log('Operation aborted')
      break
  }
}

module.exports = {
  createService,
  deleteService
}