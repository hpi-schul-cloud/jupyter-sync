/* eslint-disable no-unused-vars */
const fs = require('fs');
const rp = require('request-promise');
const common = require('./../../common');
let _prefix = 'jupyterhub-user-'; // JupyterHub specific prefix
if (process.env.NODE_ENV === 'dev')
  _prefix = '';

// envs
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3030';
const watchPath = process.env.WATCH_PATH || '/Users/langleu/GitHub/schulcloud/watching/';

// file types that are supported
const dictionary = {
  ipynb: 'application/x-ipynb+json',
  txt: 'text/plain',
  pdf: 'application/pdf'
};

const getMimeType = (fileName) => {
  if (!fileName)
    return;

  let fileExtension = fileName.split('.');
  fileExtension = fileExtension[fileExtension.length - 1];

  return dictionary[fileExtension];
};

class DirSync {
  constructor(options) {
    this.options = options || {};
    this.app = options.app || {};
    this.mongooseClient = this.app.get('mongooseClient');
  }

  async create(data, params) {
    let { userId, newFolder, baseFolder } = data;

    let adminJWT = await common.getAdminJWT();

    let jwt = await common.requestUserToken(userId, adminJWT);

    // find the base folder to use its id as parent
    return this.mongooseClient.models.directories.findOne({ name: baseFolder, isDirectory: true, owner: userId})
      .then(folder => {

        let options = {
          method: 'POST',
          uri: `${backendUrl}/fileStorage/directories`,
          headers: {
            'Authorization': jwt
          },
          body: {
            name: newFolder,
            parent: folder._id,
            isDirectory: true
          },
          json: true
        };

        // create folder on SC backend and create folder in local db
        return rp(options)
          .then(directory => {
            return this.mongooseClient.models.directories.create(directory)
              .then(res => {
                return res;
              });
          });

      });

  }

  async remove(id, params) {
    let userId = params.qs.userId;

    let adminJWT = await common.getAdminJWT();

    let jwt = await common.requestUserToken(userId, adminJWT);

    let options = {
      method: 'DELETE',
      uri: `${backendUrl}/fileStorage/directories`,
      qs: {
        _id: id.toString()
      },
      headers: {
        'Authorization': jwt
      },
      json: true
    };

    return rp(options)
      .then(_ => {
        return this.mongooseClient.models.directories.findByIdAndDelete(id);
      });
  }
}

class Service {
  constructor(options) {
    this.options = options || {};
    this.app = options.app || {};
    this.mongooseClient = this.app.get('mongooseClient');
  }

  async create(data, params) {
    let name = data.name;
    let subFolder = data.subFolder;
    let type = getMimeType(name);
    let size = 0;
    let userId = data.userId;
    let baseFolder = data.baseFolder;


    // TODO: add the _data folder in case not dev env is used
    let buffer = '';
    if (subFolder)
      buffer = fs.readFileSync(`${watchPath}/${_prefix}${userId}/${subFolder}/${name}`);
    else
      buffer = fs.readFileSync(`${watchPath}/${_prefix}${userId}/${name}`);

    size = buffer.length;

    let adminJWT = await common.getAdminJWT();

    let jwt = await common.requestUserToken(userId, adminJWT);

    let options = {
      method: 'POST',
      uri: `${backendUrl}/fileStorage/signedUrl`,
      headers: {
        'Authorization': jwt
      },
      body: {
        filename: name, // yes not an accident
        fileType: type
      },
      json: true
    };

    // get parent dir
    return this.mongooseClient.models.directories.findOne({name: baseFolder, owner: userId})
      .then(folder => {
        options.parent = folder._id;

        // Get signedUrl
        return rp(options)
          .then(signedUrl => {
            let upload = {
              method: 'PUT',
              uri: signedUrl.url,
              body: buffer
            };

            // upload File to S3
            return rp(upload)
              .then(_ => {

                let scdb = {
                  method: 'POST',
                  uri: `${backendUrl}/fileStorage`,
                  headers: {
                    'Authorization': jwt
                  },
                  body: {
                    name: name,
                    type: type,
                    size: buffer.length,
                    storageFileName: signedUrl.header['x-amz-meta-flat-name'],
                    parent: folder._id
                  },
                  json: true
                };

                // create entry in sc db
                return rp(scdb)
                  .then(file => {

                    // create entry in local db
                    return this.mongooseClient.models.files.create(file)
                      .then(res => {
                        return res;
                      })
                      .catch(err => {
                        // eslint-disable-next-line no-console
                        console.log(`Could not create ${scdb.body.name} in local db.`);
                      });
                  })
                  .catch(err => {
                    // eslint-disable-next-line no-console
                    console.log(`Could not create ${scdb.body.name} in sc db.`);
                  });
              });
          });
      });
  }

  async patch(id, data, params) {
    let size = 0;
    let { userId, subFolder, name } = data;

    let buffer = '';

    if (subFolder)
      buffer = fs.readFileSync(`${watchPath}/${_prefix}${userId}/${subFolder}/${name}`);
    else
      buffer = fs.readFileSync(`${watchPath}/${_prefix}${userId}/${name}`);

    size = buffer.length;

    let adminJWT = await common.getAdminJWT();

    let jwt = await common.requestUserToken(userId, adminJWT);

    let options = {
      method: 'PATCH',
      uri: `${backendUrl}/fileStorage/signedUrl/${id}`,
      headers: {
        'Authorization': jwt
      },
      json: true
    };

    return rp(options)
      .then(signedUrl => {
        let upload = {
          method: 'PUT',
          uri: signedUrl.url,
          body: buffer
        };

        return rp(upload)
          .then(_ => {
            let scdb = {
              method: 'PATCH',
              uri: `${backendUrl}/files/${id}`,
              headers: {
                'Authorization': jwt
              },
              body: {size: buffer.length},
              json: true
            };

            return rp(scdb)
              .then(_ => {
                return this.mongooseClient.models.files.updateOne({_id: id}, {size: buffer.length})
                  .then(res => {
                    return res;
                  });
              });
          });
      });
  }

  async remove(id, params) {
    let userId = params.qs.userId;

    let adminJWT = await common.getAdminJWT();

    let jwt = await common.requestUserToken(userId, adminJWT);

    let options = {
      method: 'DELETE',
      uri: `${backendUrl}/fileStorage/`,
      qs: {
        _id: id.toString()
      },
      headers: {
        'Authorization': jwt
      },
      json: true
    };

    return rp(options)
      .then(_ => {
        return this.mongooseClient.models.files.findByIdAndDelete(id);
      });
  }
}

module.exports.Service = Service;
module.exports.DirSync = DirSync;
