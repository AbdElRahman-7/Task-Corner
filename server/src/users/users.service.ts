import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private readonly userModel: Model<UserDocument>) {}

  async create(userData: Partial<UserDocument>) {
    const newUser = new this.userModel(userData);
    const saved = await newUser.save();
    const { password, ...safeUser } = saved.toObject();
    return safeUser;
  }

  async findAll(query?: any) {
    const filter = query?.role ? { role: query.role } : {};
    return this.userModel.find(filter).select('-password').lean().exec();
  }

  async findByEmail(email: string) {
    if (!email) return null;
    return this.userModel.findOne({ email: email.toLowerCase() }).exec();
  }

  async findByUsername(username: string) {
    if (!username) return null;
    return this.userModel.findOne({ username }).exec();
  }

  async findById(id: string) {
    return this.userModel.findById(id).select('-password').exec();
  }

  async update(id: string, updateData: Partial<UserDocument>) {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .select('-password')
      .exec();
    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }
    return updatedUser;
  }

  async remove(id: string) {
    const deletedUser = await this.userModel.findByIdAndDelete(id).select('-password').exec();
    if (!deletedUser) {
      throw new NotFoundException('User not found');
    }
    return deletedUser;
  }

  async validateUser(email: string, pass: string): Promise<any> {
    if (!email) return null;
    const user = await this.userModel.findOne({ email: email.toLowerCase() }).exec();
    if (user && (await user.comparePassword(pass))) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }
}