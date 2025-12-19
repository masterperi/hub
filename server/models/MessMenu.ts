import mongoose, { Document, Schema } from 'mongoose';

export interface IMessMenu extends Document {
  date?: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  items?: string;
  menuItems?: Array<{ name: string }>;
  hostelBlock: string;
  isDefault?: boolean;
  dayOfWeek?: number;
  isSpecial: boolean;
  specialNote?: string;
  createdAt: Date;
}

const MessMenuSchema: Schema = new Schema({
  date: { type: Date, required: false }, // Made optional for default menus
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  items: { type: String }, // Make optional, kept for backward compatibility
  menuItems: [{
    name: { type: String, required: true }
  }],
  hostelBlock: { type: String, required: true },
  isDefault: { type: Boolean, default: false },
  dayOfWeek: { type: Number, min: 0, max: 6 }, // 0=Sun, 6=Sat
  isSpecial: { type: Boolean, default: false },
  specialNote: { type: String },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MessMenu || mongoose.model<IMessMenu>('MessMenu', MessMenuSchema);