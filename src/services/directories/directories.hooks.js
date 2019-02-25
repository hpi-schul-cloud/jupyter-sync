const fs = require('fs');
const rm = require('rimraf');
const watchPath = process.env.WATCH_PATH || '/Users/langleu/GitHub/schulcloud/watching';
const common = require('./../../common');
let _prefix = 'jupyterhub-user-'; // JupyterHub specific prefix
if (process.env.NODE_ENV === 'dev')
  _prefix = '';

const createLocalDir = (hook) => {
  let folder = hook.result;
  let dirName = folder.name;
  let dir = `${watchPath}/${_prefix}${folder.owner.toString()}/${dirName}`;
  if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
  }
};

/**
 * removes a directory forcefully.
 * @param hook
 */
const removeLocalDir = (hook) => {
  let folder = hook.result;
  let dirName = folder.name;
  let dir = `${watchPath}/${_prefix}${folder.owner.toString()}/${dirName}`;
  if (!fs.existsSync(dir)){
    rm.sync(dir);
  }
};

module.exports = {
  before: {
    all: [common.restrictAccess],
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
    create: [createLocalDir],
    update: [],
    patch: [],
    remove: [removeLocalDir]
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
