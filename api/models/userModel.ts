import {
  model,
  Schema,
  type HydratedDocument,
} from 'mongoose';

export type UserRole = 'admin';

export interface IUser {
  name: string;
  email: string;
  passwordHash?: string;
  googleId?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = HydratedDocument<IUser>;

const userSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      maxlength: 254,
    },

    passwordHash: {
      type: String,
      select: false,
    },

    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },

    role: {
      type: String,
      enum: ['admin'],
      default: 'admin',
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const User = model<IUser>('User', userSchema);

export default User;