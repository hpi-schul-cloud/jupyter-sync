const chokidar = require('chokidar');
const fs = require('fs');
const watchPath = process.env.WATCH_PATH || '/Users/langleu/GitHub/schulcloud/watching/';

/**
 * returns the UserId which is either encapsulated in a string or is the userId itself
 * @param path
 * @returns {*}
 */
const returnUserId = (path) => {
  if (path && path.includes('-')) {
    let splitPath = path.split('-');

    return splitPath[2];
  }
  return path;
};

module.exports = function (app) {
  this.app = app;

  chokidar.watch(watchPath, {ignored: /(^|[/\\])\../}).on('all', (event, path) => {
    const fileService = app.service('files');
    const dirService = app.service('directories');
    const userService = app.service('users');

    // eslint-disable-next-line no-console
    console.log(event, path);

    /**
     * File change detected on file system
     */
    if (event == 'change') {
      let key = path.substr(watchPath.length);
      let arr = key.split('/');
      let fileName = arr.pop();

      // in case the path is /x/ instead of x/ after substr
      if (arr[0] === '')
        arr.shift();

      let userId = arr[0];
      userId = returnUserId(userId);
      if (userId === undefined)
        return;

      let baseFolder = undefined;
      let subFolder = undefined;

      // check whether subfolders are present
      if (arr.length > 1) {
        baseFolder = arr[arr.length - 1];
        subFolder = arr.splice(-1, 1).join('/');
      } else {
        baseFolder = 'JupyterHub';
      }

      // find parentFolder
      dirService.find({query: {owner: userId, name: baseFolder }})
        .then(folders => {
          // find file entry and update it
          fileService.find({query: {owner: userId, name: fileName, parent: folders.data[0]._id}})
            .then(files => {
              let _id = files.data[0]._id;

              this.app.service('sync').patch(_id, {
                userId,
                subFolder,
                name: fileName
              });
            })
            .catch(() => {
              // eslint-disable-next-line no-console
              console.log(`Could not find entry for ${userId} and ${fileName}`);
            });
        });
    }

    /**
     * new File added to file system
     */
    if (event == 'add') {
      let key = path.substr(watchPath.length);
      let arr = key.split('/');
      let fileName = arr.pop();

      // in case the path is /x/ instead of x/ after substr
      if (arr[0] === '')
        arr.shift();

      let userId = arr[0];
      userId = returnUserId(userId);
      if (userId === undefined)
        return;

      let baseFolder = undefined;
      let subFolder = undefined;

      // check whether subfolders are present
      if (arr.length > 1) {
        baseFolder = arr[arr.length - 1];
        subFolder = arr.splice(-1, 1).join('/');
      } else {
        baseFolder = 'JupyterHub';
      }


      fileService.find({query: {owner: userId, name: fileName}})
        .then(res => {
          // if size is different update entries
          if (res.total === 1) {
            if (res.data[0].size) {
              let stats = fs.statSync(path);
              let fileSize = stats.size;

              // file changed locally while server was offline
              if (fileSize !== res.data[0].size) {
                this.app.service('sync').patch(res.data[0]._id, {
                  name: fileName,
                  fileId: res.data[0]._id,
                  userId,
                  storageFileName: res.data[0].storageFileName
                });
              }
            }
          }

          // if file is not existing in db create it
          if (res.total === 0) { // create file
            this.app.service('sync').create({
              name: fileName,
              baseFolder,
              userId: userId,
              subFolder
            });
          }
        })
        .catch(() => {
          // eslint-disable-next-line no-console
          console.log(`Could not find entry for ${userId} and ${fileName}`);
        });
    }

    /**
     * File got renamed or deleted
     */
    if (event == 'unlink') {
      let key = path.substr(watchPath.length);
      let arr = key.split('/');
      let fileName = arr.pop();

      // in case the path is /x/ instead of x/ after substr
      if (arr[0] === '')
        arr.shift();

      let userId = arr[0];
      userId = returnUserId(userId);
      if (userId === undefined)
        return;

      let baseFolder = undefined;

      // check if subfolders are present
      if (arr.length <= 1)
        baseFolder = 'JupyterHub';
      else
        baseFolder = arr[arr.length - 1];

      dirService.find({query: {owner: userId, name: baseFolder }})
        .then(folders => {
          fileService.find({query: {owner: userId, name: fileName, parent: folders.data[0]._id}})
            .then(files => {
              this.app.service('sync').remove(files.data[0]._id, {
                qs: {
                  userId,
                  _id: files.data[0]._id
                }
              });
            })
            .catch(() => {
              // eslint-disable-next-line no-console
              console.log(`Could not find entry for ${userId} and ${fileName}`);
            });
        });
    }

    /**
     * new Folder got added to file system
     */
    if (event == 'addDir') {
      let dir = path.substr(watchPath.length);
      let arr = dir.split('/');

      if (arr.length === 1) {
        // new user was created (meaning a new jupyter instance got created)
        // need to add the user to the local DB or check whether he already exists.

        // check whether it could be an ObjectId (24 length)
        if (returnUserId(arr[0]).length !== 24)
          return;

        // TODO: rethink whether the user is needed or just create the base directory for the user on the SC side.
        return userService.find({ _id: arr[0] })
          .then(users => {
            if (users.total === 0) {
              return userService.create({_id: arr[0]})
                .then(() => {});
            }
          });
      }

      // in case the path is /x/ instead of x/ after substr
      if (arr[0] === '')
        arr.shift();

      let userId = arr[0];
      userId = returnUserId(userId);
      if (userId === undefined)
        return;

      // TODO: add special case for docker, where files are in a subdir called _data
      let newFolder = arr[arr.length - 1];
      let baseFolder = arr[arr.length -2];
      if (baseFolder === userId)
        baseFolder = 'JupyterHub';

      // check whether folder exists otherwise create
      dirService.find({ query: {name: newFolder, owner: userId}})
        .then(dirs => {
          if (dirs.total === 0) {
            this.app.service('sync/dir').create({
              userId,
              newFolder,
              baseFolder
            });
          }
        });
    }

    /**
     * Folder got deleted
     */
    if (event == 'unlinkDir') {
      let dir = path.substr(watchPath.length);
      let arr = dir.split('/');
      if (arr.length === 1) return; // just userId should probs never appear in unlinkDir

      // in case the path is /x/ instead of x/ after substr
      if (arr[0] === '')
        arr.shift();

      let userId = arr[0];
      userId = returnUserId(userId);

      let folderName = arr[arr.length - 1];

      dirService.find({ query:{name: folderName, owner: userId}})
        .then(dirs => {
          this.app.service('sync/dir').remove(dirs.data[0]._id, {
            qs: {
              userId
            }
          });
        });
    }

  });
};
