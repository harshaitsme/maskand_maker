import { Address, UserDoc, UserStats } from "./user.entity.js";
import { UserModel, UserMongooseDoc } from "./user.schema.js";
import { SEED_USERS } from "./seed.data.js";

export class UserRepository {
  async create(userData: Partial<UserDoc>): Promise<UserMongooseDoc> {
    const user = new UserModel(userData);
    return await user.save();
  }

  async findByEmail(email: string): Promise<UserMongooseDoc | null> {
    return await UserModel.findOne({ email: email.toLowerCase().trim() }).exec();
  }

  async findById(id: string): Promise<UserMongooseDoc | null> {
    return await UserModel.findById(id).exec();
  }

  async findAll(limit = 50, offset = 0): Promise<UserMongooseDoc[]> {
    return await UserModel.find().skip(offset).limit(limit).sort({ createdAt: -1 }).exec();
  }

  async updateProfile(id: string, updates: Partial<UserDoc>): Promise<UserMongooseDoc | null> {
    // Prevent overriding passwordHash directly through updateProfile
    const safeUpdates = { ...updates };
    delete safeUpdates.passwordHash;
    delete safeUpdates.id;

    return await UserModel.findByIdAndUpdate(
      id,
      { $set: safeUpdates },
      { new: true, runValidators: true }
    ).exec();
  }

  async addWishlistItem(userId: string, maskSlug: string): Promise<UserMongooseDoc | null> {
    return await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { wishlist: maskSlug } },
      { new: true }
    ).exec();
  }

  async removeWishlistItem(userId: string, maskSlug: string): Promise<UserMongooseDoc | null> {
    return await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { wishlist: maskSlug } },
      { new: true }
    ).exec();
  }

  async addAddress(userId: string, address: Address): Promise<UserMongooseDoc | null> {
    const user = await UserModel.findById(userId);
    if (!user) return null;

    if (address.isDefault) {
      user.addresses.forEach((a: Address) => {
        a.isDefault = false;
      });
    }

    user.addresses.push(address);
    return await user.save();
  }

  async updateAddress(
    userId: string,
    addressId: string,
    updatedFields: Partial<Address>
  ): Promise<UserMongooseDoc | null> {
    const user = await UserModel.findById(userId);
    if (!user) return null;

    const targetAddr = user.addresses.find((a: Address) => a.id === addressId);
    if (!targetAddr) return null;

    if (updatedFields.isDefault) {
      user.addresses.forEach((a: Address) => {
        a.isDefault = false;
      });
    }

    Object.assign(targetAddr, updatedFields);
    return await user.save();
  }

  async removeAddress(userId: string, addressId: string): Promise<UserMongooseDoc | null> {
    return await UserModel.findByIdAndUpdate(
      userId,
      { $pull: { addresses: { id: addressId } } },
      { new: true }
    ).exec();
  }

  async addClaimedCert(userId: string, certId: string): Promise<UserMongooseDoc | null> {
    return await UserModel.findByIdAndUpdate(
      userId,
      { $addToSet: { claimedCertIds: certId } },
      { new: true }
    ).exec();
  }

  async getStats(): Promise<UserStats> {
    const totalUsers = await UserModel.countDocuments();
    const buyersCount = await UserModel.countDocuments({ role: "buyer" });
    const artisansCount = await UserModel.countDocuments({ role: "artisan" });
    const verifiersCount = await UserModel.countDocuments({ role: "verifier" });
    const adminsCount = await UserModel.countDocuments({ role: "admin" });

    return {
      totalUsers,
      buyersCount,
      artisansCount,
      verifiersCount,
      adminsCount,
    };
  }

  async updateRole(id: string, role: UserDoc["role"]): Promise<UserMongooseDoc | null> {
    return await UserModel.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true, runValidators: true }
    ).exec();
  }

  async syncAdminUsers(): Promise<void> {
    const adminSeeds = SEED_USERS.filter((u) => u.role === "admin");
    for (const adminUser of adminSeeds) {
      const email = adminUser.email.toLowerCase().trim();
      const existing = await UserModel.findOne({ email }).exec();
      if (!existing) {
        await UserModel.create(adminUser);
      } else if (existing.role !== "admin") {
        await UserModel.findByIdAndUpdate(existing._id, { $set: { role: "admin" } }).exec();
      }
    }
  }

  async seedInitialData(force = false): Promise<{ count: number }> {
    const count = await UserModel.countDocuments();
    if (count > 0 && !force) {
      return { count };
    }

    if (force) {
      await UserModel.deleteMany({});
    }

    await UserModel.insertMany(SEED_USERS);
    const newCount = await UserModel.countDocuments();
    return { count: newCount };
  }
}
