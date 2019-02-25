// files-model.js - A mongoose model
//
// See http://mongoosejs.com/docs/models.html
// for more of what you can do here.
module.exports = function (app) {
  const mongooseClient = app.get('mongooseClient');
  const { Schema } = mongooseClient;
  const files = new Schema({
    _id: { type: Schema.Types.ObjectId, required: true},
    isDirectory: { type: Boolean, default: false },
    name: { type: String },
    size: { type: Number },
    type: { type: String },
    storageFileName: { type: String },
    parent: { type: Schema.Types.ObjectId, ref: 'files' },
    owner: {
      type: Schema.Types.ObjectId,
      required: true
    },
    refOwnerModel: {
      type: String,
      required: true,
      enum: ['user', 'course', 'teams'],
    }
  }, {
    timestamps: true
  });

  return mongooseClient.model('files', files);
};
