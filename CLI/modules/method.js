const path = require("path")
const fs = require("fs")
const fsPromises = require("fs").promises;
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })
const prompt = require("prompt-sync")({ sigint: true });
const replace = require('replace-in-file');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const { createMethodRouter, deleteMethodRouter } = require("./router");

const askConfirmation = async (message) => {
  const answer = await prompt(message);
  return answer.toLocaleLowerCase()
}

const createMethod = async (service_name, method_name) => {
  if (!fs.existsSync(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}`)) {
    await fsPromises.mkdir(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}`);

    // CONTROLLER CREATION
    await fsPromises.writeFile(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}/controller.js`,`const path = require('path');\nrequire('dotenv').config({ path: path.resolve(process.env.ENV_PATH, '.env') }); // SUPPORT .ENV FILES\nconst processCWD = process.cwd()\nprocess.chdir(process.env.SERVICES_PATH + '/${service_name}/model');\nconst { PrismaClient } = require(process.env.SERVICES_PATH + '/${service_name}/interface')\nconst interface = new PrismaClient()\nprocess.chdir(processCWD)\n\nmodule.exports = async (args) => {\n\tlet result = null\n\tlet error = null\n\ttry{\n\t\t\n\t}catch(e){\n\t\terror = { "code": -32603, "message": "Internal error", data: e.toString() }\n\t}\n\treturn {error, result}\n}`,'utf-8')
    
    // METHOD CREATION
    await fsPromises.writeFile(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}/method.js`,`const ${method_name}_controller = require('./controller')\n\nmodule.exports = async (args,callback) => {\n\tconst {error,result} = await ${method_name}_controller(args)\n\treturn callback(error,result)\n}`,'utf-8')

    // ROUTER INJECTION
    await createMethodRouter(service_name,method_name)

    await exec(`code ${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}/controller.js`)
  }else{
    console.log('Service\'s Method Already Exist')
  }
}

const deleteMethod = async (service_name, method_name) => {
  if(fs.existsSync(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}`)){
    fs.rmSync(`${process.env.SERVICES_PATH}/${service_name}/microservices/${method_name}`,{recursive:true})
    await deleteMethodRouter(service_name, method_name)
  }
}



module.exports = { createMethod, deleteMethod }