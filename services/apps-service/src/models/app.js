import mongoose from 'mongoose';

const appSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
  },
  { timestamps: true }
);

export function getAppModel() {
  return mongoose.models.App || mongoose.model('App', appSchema);
}
