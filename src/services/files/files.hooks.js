const rp = require('request-promise');
const fs = require('fs');
const common = require('./../../common');
let _prefix = 'jupyterhub-user-';
if (process.env.NODE_ENV === 'test')
  _prefix = '';

// envs
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3030';
const watchPath = process.env.WATCH_PATH || '/Users/langleu/GitHub/schulcloud/watching';

let adminJWT;

// receives superhero jwt
const getAdminJWT = async (hook) => {
  if (adminJWT)
    return hook;

  adminJWT = await common.getAdminJWT();

  return hook;
};

// requests user jwt with the superhero jwt
const requestUserToken = async (hook) => {
  const userId = hook.result.userId;

  hook.jwt = await common.requestUserToken(userId, adminJWT);

  return hook;
};

// TODO: support subFolders
// request file and download to local filesystem
const requestFile = (hook) => {
  const file = hook.result;
  const jwt = hook.jwt;
  const userId = file.owner;
  const fileName = file.name;

  let options = {
    method: 'GET',
    uri: `${backendUrl}/fileStorage/signedUrl`,
    headers: {
      'Authorization': jwt
    },
    qs: {
      file: file._id,
      download: true
    },
    json: true
  };

  rp(options)
    .then(signedUrl => {
      let download = {
        uri: signedUrl.url,
        encoding: null
      };

      return rp(download)
        .then(binary => {
          let dir = `${watchPath}/${_prefix}${userId}`;

          if (!fs.existsSync(dir)){
            fs.mkdirSync(dir);
          }

          fs.writeFile(`${dir}/${fileName}`, binary, function(err) {
            if (err) throw err;
          });

          return hook;
        });

    });

  return hook;
};

const removeLocalFile = async (hook) => {
  let id = hook.id;

  let file = await hook.app.service('files').get(id);

  // TODO: resolve subFolders of file and build path, recursive

  let path = '';

  let remFile = `${watchPath}/${_prefix}${file.owner.toString()}/${path}`;

  fs.unlink(remFile, (err) => {
    if (err) return;
  });
};

// trying to break the circle mentioned in the README
const checkWhetherFileAlreadyExists = (hook) => {
  const mongooseClient = hook.app.get('mongooseClient');
  const file = hook.data;

  return mongooseClient.models.files.find({name: file.name, owner: file.userId})
    .then(files => {
      if (files.length > 0)
        throw new Error('File already exists');
      else
        return hook;
    });
};

const checkWhetherFileStillExists = (hook) => {
  const mongooseClient = hook.app.get('mongooseClient');
  const fileId = hook.id;

  return mongooseClient.models.files.findById(fileId)
    .then(files => {
      if (files === null)
        throw new Error('File doesn\'t exist anymore');
      else
        return hook;
    });
};

module.exports = {
  before: {
    all: [common.restrictAccess],
    find: [],
    get: [],
    create: [checkWhetherFileAlreadyExists],
    update: [],
    patch: [],
    remove: [checkWhetherFileStillExists]
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [
      getAdminJWT,
      requestUserToken,
      requestFile
    ],
    update: [],
    patch: [],
    remove: [removeLocalFile]
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
