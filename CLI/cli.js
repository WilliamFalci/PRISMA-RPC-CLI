const { Command } = require('commander');
const { createService } = require('./modules/service');
const { createMethod, deleteService } = require('./modules/method');

const program = new Command();

program
  .name('PRISMA NODE CLUSTER')
  .description('\n───────────────────────────────────────────────────────────────\n\n🚀 ・ Full Stack RPC Service Manager with Multi-DB management\n\n💻 ・ Created with 💕 from Italy by Falci William Peter\n\n⭐ ・ https://github.com/WilliamFalci\n\n───────────────────────────────────────────────────────────────')
  .version('0.8.0');

program.command('service')
  .description('Service Handler')
  .argument('<service_name>', 'service name')
  .option('-create, --create', 'create service')
  .option('-delete, --delete', 'delete service')
  .action(async (service_name, options) => {
    console.log(service_name, options)

    switch (Object.keys(options).length) {
      case 1:

        if (options.create) {
          await createService(service_name)
        }

        if (options.delete) {
          await deleteService(service_name)
        }
        break
      case 0:
        console.log('You have to choice an option: -create, -delete')
        break;
      default:
        console.log('Too many options')
        break;

    }
  });

  program.command('method')
  .description('Service Handler')
  .argument('<service_name>', 'service name')
  .argument('<method_name>', 'service name')
  .option('-create, --create', 'create service')
  .option('-delete, --delete', 'delete service')
  .action(async (service_name, method_name, options) => {
    console.log(service_name, method_name, options)

    switch (Object.keys(options).length) {
      case 1:

        if (options.create) {
          await createMethod(service_name, method_name)
        }

        if (options.delete) {
          console.log('TO DO')
        }
        break
      case 0:
        console.log('You have to choice an option: -create, -delete')
        break;
      default:
        console.log('Too many options')
        break;

    }
  });

program.parse();