module.exports = function (plop) {
  plop.setGenerator('module', {
    description: 'Generate a full NestJS module with schema, DTO, and CRUD',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'Module name (e.g., property):',
      },
    ],
    actions: [
      {
        type: 'add',
        path: 'src/{{kebabCase name}}/{{kebabCase name}}.module.ts',
        templateFile: 'plop-templates/module.module.hbs',
      },
      {
        type: 'add',
        path: 'src/{{kebabCase name}}/schemas/{{kebabCase name}}.schema.ts',
        templateFile: 'plop-templates/schema.hbs',
      },
      {
        type: 'add',
        path: 'src/{{kebabCase name}}/dto/create-{{kebabCase name}}.dto.ts',
        templateFile: 'plop-templates/create-dto.hbs',
      },
      {
        type: 'add',
        path: 'src/{{kebabCase name}}/{{kebabCase name}}.service.ts',
        templateFile: 'plop-templates/service.hbs',
      },
      {
        type: 'add',
        path: 'src/{{kebabCase name}}/{{kebabCase name}}.controller.ts',
        templateFile: 'plop-templates/controller.hbs',
      },
      // Add more files as needed (e.g., update-dto)
    ],
  });
};