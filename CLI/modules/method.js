const path = require("path")
const fs = require("fs")
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })
const prompt = require("prompt-sync")({ sigint: true });
const replace = require('replace-in-file');

const { createMethodRouter } = require("./router");
const { deleteServiceDB } = require('./db')

const askConfirmation = async (message) => {
  const answer = await prompt(message);
  return answer.toLocaleLowerCase()
}

const createMethod = async (service_name, method_name) => {
  if (!fs.existsSync(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}`)) {
    await fsPromises.mkdir(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}`);

    // CONTROLLER CREATION
    await fsPromises.writeFile(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}/controller.js`,`const path = require('path'); 
    require('dotenv').config({ path: path.resolve(process.env.ENV_PATH, '.env') }); // SUPPORT .ENV FILES 
    const processCWD = process.cwd() 
    process.chdir(process.env.SERVICES_PATH + '/${service_name}/model'); 
    const { PrismaClient } = require(process.env.SERVICES_PATH + '/${service_name}/model/interface') 
    const interface = new PrismaClient() 
    process.chdir(processCWD)`,'utf-8')

    // METHOD CREATION
    await fsPromises.writeFile(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}/method.js`,`const ${method_name}_controller = require('./controller')\n\nmodule.exports = async (args,callback) => {\n\tconst {error,result} = await ${method_name}_controller(args)\n\treturn callback(error,result)\n}`,'utf-8')

    // ROUTER INJECTION
    await createMethodRouter(service_name,method_name)

  }else{
    console.log('Service\'s Method Already Exist')
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

module.exports = { createMethod, deleteService }