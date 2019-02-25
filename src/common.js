const rp = require('request-promise');

// envs
const backendUrl = process.env.BACKEND_URL || 'http://localhost:3030';
const adminName = process.env.ADMIN_NAME || 'admin@schul-cloud.org';
const adminPw = process.env.ADMIN_PW || 'Schulcloud1!';

/**
 * generates a superhero JWT for given base variables (adminName and adminPw).
 * @returns {Promise<*>}
 */
exports.getAdminJWT = async () => {
  let options = {
    method: 'POST',
    uri: `${backendUrl}/authentication`,
    body: {
      username: adminName,
      password: adminPw
    },
    json: true
  };

  return rp(options)
    .then(res => {
      return res.accessToken;
    });
};

/**
 * generates a JWT for a given userId and admin JWT.
 * @param userId
 * @param adminJWT
 * @returns {Promise<*>}
 */
exports.requestUserToken = async (userId, adminJWT) => {
  let options = {
    method: 'POST',
    uri: `${backendUrl}/accounts/jwt`,
    headers: {
      'Authorization': adminJWT
    },
    body: {
      userId
    },
    json: true
  };

  return rp(options)
    .then(res => {
      return res;
    });
};

/**
 * checks whether a valid access_token is present as query parameter.
 * @param hook
 * @returns {*}
 */
exports.restrictAccess = (hook) => {
  let access_key = (hook.params.query || {}).access_key;

  if (access_key == (process.env.ACCESS_KEY || 'secret' ) || typeof hook.params.provider == 'undefined')
    return hook;
  else
    throw new Error('Not authenticated!');
};
