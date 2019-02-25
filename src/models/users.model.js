// users-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const users = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true, unique: true},
    baseFolder: { type: Schema.Types.ObjectId }
  }, {
    timestamps: true
  });

  return mongooseClient.model('users', users);
};
