const assert = require('assert');
const app = require('../../src/app');
const userId = '0000d213816abba584714c0a';
const mock = require('mock-fs');
let folderId = '';
let fileId = '';
let subDirFileId = '';

describe('\'sync\' service', () => {
  before(function (done) {
    mock({
      '/Users/langleu/GitHub/schulcloud/watching/': {},
      '/Users/langleu/GitHub/schulcloud/watching/jupyterhub-user-0000d213816abba584714c0a/': {
        'random.txt': 'test file'
      },
      '/Users/langleu/GitHub/schulcloud/watching/jupyterhub-user-0000d213816abba584714c0a/random/': {
        'test.txt': 'test file 2'
      }
    });

    done();
  });

  after(function (done) {
    mock.restore();
    done();
  });

  it('registered the service', () => {
    const service = app.service('sync');

    assert.ok(service, 'Registered the service');
  });

  it('should check whether base folder exists otherwise create', async () => {
    let result = await app.service('directories').find({ query: {owner: userId, name: 'JupyterHub'}});
    if (result.total === 0)
      await app.service('users').create({_id: userId});
  });

  it('should create a directory', async () => {
    let result = await app.service('sync/dir').create({
      userId: userId,
      newFolder: 'random',
      baseFolder: 'JupyterHub'
    });

    folderId = result._id;

    assert.equal(result.name, 'random');
  });

  it('should create a file in a subdir', async () => {
    let result = await app.service('sync').create({
      name: 'test.txt',
      baseFolder: 'random',
      subFolder: 'random',
      userId
    });

    subDirFileId = result._id;

    assert.equal(result.name, 'test.txt');
    assert.equal(result.owner, userId);
    assert.equal(result.type, 'text/plain');
  });

  it('should remove a file in a subdir', async () => {
    let result = await app.service('sync').remove(subDirFileId, {qs: { userId }});

    assert.equal(result.name, 'test.txt');
    assert.equal(result.owner, userId);
    assert.equal(result.type, 'text/plain');
  });

  it('should create a file', async () => {
    let result = await app.service('sync').create({
      name: 'random.txt',
      baseFolder: 'random',
      userId
    });

    fileId = result._id;

    assert.equal(result.name, 'random.txt');
    assert.equal(result.owner, userId);
    assert.equal(result.type, 'text/plain');
  });

  it('should patch a file', async () => {
    let result = await app.service('sync').patch(fileId, {
      name: 'random.txt',
      userId
    });

    assert.notEqual(result, null);
  });

  it('should remove a file', async () => {
    let result = await app.service('sync').remove(fileId, {qs: { userId }});

    assert.equal(result.name, 'random.txt');
    assert.equal(result.owner, userId);
    assert.equal(result.type, 'text/plain');
  });

  it('should remove a directory', async () => {
    let result = await app.service('sync/dir').remove(folderId, { qs: { userId }});

    assert.equal(result.name, 'random');
  });
});
