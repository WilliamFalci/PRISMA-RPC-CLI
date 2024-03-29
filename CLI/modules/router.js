const path = require("path")
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })
const replace = require('replace-in-file');
const fsPromises = require("fs").promises;


const createServiceRouter = async (service_name) => {
  await fsPromises.writeFile(`${process.env.SERVICES_PATH}/${service_name}/router.js`,`// IMPORT\n\n// EXPORT\nmodule.exports = {\n}`,'utf-8')
  await replace({
    files: `${process.env.RPC_PATH}/router.js`,
    from: /(\/\/ DO NOT ALTER OR DELETE THIS LINE - IMPORT SERVICES METHODS\n)/gm,
    to: `// DO NOT ALTER OR DELETE THIS LINE - IMPORT SERVICES METHODS\nconst ${service_name} = require('./services/${service_name}/router.js');`
  })
  await replace({
    files: `${process.env.RPC_PATH}/router.js`,
    from: /(let methods = {}\n)/gm,
    to: `let methods = {}\n\tmethods = Object.assign(methods,{${service_name}: ${service_name}});\n`
  })
}

const createMethodRouter = async (service_name, method_name) => {
  await replace({
    files: `${process.env.SERVICES_PATH}/${service_name}/router.js`,
    from: /(\/\/ IMPORT\n)/gm,
    to: `// IMPORT\nconst ${method_name}_method = require('./microservices/${method_name}/method.js')\n`
  })
  await replace({
    files: `${process.env.SERVICES_PATH}/${service_name}/router.js`,
    from: /(module.exports = {\n)/gm,
    to: `module.exports = {\n\t${method_name}: (args,callback) => ${method_name}_method(args, callback),\n`
  })
}

const deleteMethodRouter = async (service_name, method_name) => {
  const regexMethodName = new RegExp(`(.*${method_name}.*)\n`,'gm')
  await replace({
    files: `${process.env.SERVICES_PATH}/${service_name}/router.js`,
    from: regexMethodName,
    to: ``
  })
}

module.exports = {
  createServiceRouter,
  createMethodRouter,
  deleteMethodRouter
}