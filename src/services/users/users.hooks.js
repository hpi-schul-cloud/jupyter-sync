const backendUrl = process.env.BACKEND_URL || 'http://localhost:3030';

const rp = require('request-promise');
const common = require('../../common');

const createNeededFolders = async (hook) => {
  const directoryService = hook.app.service('directories');
  const user = hook.result;

  let adminJWT = await common.getAdminJWT();

  let userJWT = await common.requestUserToken(user._id, adminJWT);

  let options = {
    method: 'POST',
    uri: `${backendUrl}/fileStorage/directories`,
    headers: {
      'Authorization': userJWT
    },
    body: {
      name: 'JupyterHub',
      isDirectory: true
    },
    json: true
  };

  return rp(options)
    .then(directory => {
      return directoryService.create(directory)
        .then(() => {
          return hook;
        });
    });

};

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [createNeededFolders],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
