const assert = require('assert');
const app = require('../../src/app');
const fileService = app.service('files');

describe('\'files\' service', () => {
  it('registered the service', () => {
    const service = app.service('files');

    assert.ok(service, 'Registered the service');
  });

  it('should be able to retrieve files', async () => {
    let result = await fileService.find();

    assert.notEqual(result, undefined);
    assert.equal(result.skip, 0);
    assert.equal(result.limit, 10);
  });
});
