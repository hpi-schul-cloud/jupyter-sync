const restrict = (hook) => {
  if (typeof hook.params.provider == 'undefined')
    return hook;
  else
    throw new Error('Not authenticated!');
};

module.exports = {
  before: {
    all: [restrict],
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
    create: [],
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
