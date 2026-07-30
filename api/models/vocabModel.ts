import mongoose, { Schema, Document } from 'mongoose';

export interface IVocab extends Document {
  english: string;
  german: string;
}

const VocabSchema: Schema = new Schema(
  {
    english: {
      type: String,
      required: 'English word cannot be blank',
    },
    german: {
      type: String,
      required: 'German word cannot be blank',
    },
  },
  { collection: 'vocab' }
);

export default mongoose.model<IVocab>('Vocab', VocabSchema);