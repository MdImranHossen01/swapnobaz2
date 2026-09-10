import mongoose, { Document, Model, Schema } from 'mongoose';

export interface ISupplier extends Document {
  name: string;
  companyName?: string;
  phone: string;
  email?: string;
  address?: string;
  currentBalance: number;
  userId?: mongoose.Types.ObjectId;
  businessType?: string;
  productCategories?: string;
  tradeLicense?: string;
  supplyCapacity?: string;
  status?: 'pending' | 'active' | 'suspended';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SupplierSchema: Schema<ISupplier> = new Schema(
  {
    name: { type: String, required: true },
    companyName: { type: String },
    phone: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    address: { type: String },
    currentBalance: { type: Number, default: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    businessType: { type: String },
    productCategories: { type: String },
    tradeLicense: { type: String },
    supplyCapacity: { type: String },
    status: { type: String, enum: ['pending', 'active', 'suspended'], default: 'pending' },
    description: { type: String }
  },
  { timestamps: true }
);

const Supplier: Model<ISupplier> = mongoose.models.Supplier || mongoose.model<ISupplier>('Supplier', SupplierSchema);

export default Supplier;
