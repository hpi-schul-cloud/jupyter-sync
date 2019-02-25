// Initializes the `sync` service on path `/sync`
const createService = require('./sync.class.js');
const hooks = require('./sync.hooks');

module.exports = function (app) {

  const paginate = app.get('paginate');

  const options = {
    paginate,
    app
  };

  // Initialize our service with any options it requires
  app.use('/sync/dir', new createService.DirSync(options));
  app.use('/sync', new createService.Service(options));

  // Get our initialized service so that we can register hooks
  const service = app.service('sync');
  const dirService = app.service('sync/dir');

  service.hooks(hooks);
  dirService.hooks(hooks);
};
