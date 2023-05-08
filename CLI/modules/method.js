const path = require("path")
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })
const { createMethodRouter } = require("./router");


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

module.exports = { createMethod }