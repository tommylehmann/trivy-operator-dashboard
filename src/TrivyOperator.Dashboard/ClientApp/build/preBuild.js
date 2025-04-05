const $RefParser = require('@apidevtools/json-schema-ref-parser');
const NgOpenApiGen = require('ng-openapi-gen').NgOpenApiGen;

generateApi();

async function generateApi() {
  const options = {
    input: 'backend-api.yaml',
    output: 'src/api',
  };

  const RefParser = new $RefParser();

  try {
    const openApi = await RefParser.bundle(options.input, {
      dereference: { circular: false },
    });

    // Filter out undesired media types
    if (openApi.paths) {
      for (const path in openApi.paths) {
        for (const method in openApi.paths[path]) {
          const operation = openApi.paths[path][method];
          if (operation.responses) {
            for (const responseCode in operation.responses) {
              const response = operation.responses[responseCode];
              if (response.content) {
                // Keep only 'application/json', remove other media types
                const allowedMediaType = 'application/json';
                Object.keys(response.content).forEach((mediaType) => {
                  if (mediaType !== allowedMediaType) {
                    delete response.content[mediaType];
                  }
                });
              }
            }
          }
        }
      }
    }

    const ngOpenGen = new NgOpenApiGen(openApi, options);
    ngOpenGen.generate();
    console.log('API generation successful! Conflicting media types filtered.');
  } catch (err) {
    console.error('Error while processing the OpenAPI specification:', err);
  }
}
