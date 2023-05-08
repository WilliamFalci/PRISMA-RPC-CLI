const path = require("path")
require('dotenv').config({ path: path.resolve(__dirname, `../env/.env`) })

const fs = require("fs");
const fsPromises = require("fs").promises;
const util = require('util');
const exec = util.promisify(require('child_process').exec);
const replace = require('replace-in-file');

const { createServiceDB } = require('./db');
const { createServiceRouter } = require("./router");

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
      to: `../interface`
    })

    // INIT CREDENTIALS
    await createServiceDB(service_name)
  }else{
    console.log('Service Already Exist')
  }
}

module.exports = {
  createService
}