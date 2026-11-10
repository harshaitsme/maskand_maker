import mongoose, { Document, Schema } from "mongoose";
import { Address, UserDoc, UserRole } from "./user.entity.js";

export interface UserMongooseDoc extends UserDoc, Document {}

const AddressSchema = new Schema<Address>(
  {
    id: { type: String, required: true },
    label: { type: String, required: true, default: "Home" },
    fullName: { type: String, required: true },
    addressLine: { type: String, required: true },
    city: { type: String, required: true },
    postalCode: { type: String, default: "" },
    country: { type: String, default: "Sri Lanka" },
    phone: { type: String, default: "" },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const UserSchema = new Schema<UserMongooseDoc>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    passwordHash: {
      type: String,
      default: "",
    },
    authProvider: {
      type: String,
      enum: ["local", "google", "preview"],
      default: "local",
      index: true,
    },
    googleId: {
      type: String,
      sparse: true,
      default: null,
    },
    role: {
      type: String,
      enum: ["buyer", "artisan", "verifier", "admin"],
      default: "buyer",
      index: true,
    },
    initials: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },
    location: {
      type: String,
      default: "Sri Lanka",
    },
    artisanSlug: {
      type: String,
      default: null,
    },
    wishlist: {
      type: [String],
      default: [],
    },
    addresses: {
      type: [AddressSchema],
      default: [],
    },
    claimedCertIds: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    collection: "identity-svc",
    timestamps: true,
  }
);

// Virtual property to expose string 'id'
UserSchema.virtual("id").get(function () {
  return this._id.toHexString();
});
UserSchema.set("toJSON", { virtuals: true });
UserSchema.set("toObject", { virtuals: true });

export const UserModel =
  mongoose.models.User || mongoose.model<UserMongooseDoc>("User", UserSchema);
