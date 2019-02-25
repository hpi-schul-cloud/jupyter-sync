const files = require('./files/files.service.js');
const sync = require('./sync/sync.service.js');
const directories = require('./directories/directories.service.js');
const users = require('./users/users.service.js');
// eslint-disable-next-line no-unused-vars
module.exports = function (app) {
  app.configure(files);
  app.configure(sync);
  app.configure(directories);
  app.configure(users);
};
