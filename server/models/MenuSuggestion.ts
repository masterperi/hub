import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuSuggestion extends Document {
  userId: mongoose.Types.ObjectId;
  dishName: string;
  description?: string;
  votes: number;
  hostelBlock: string;
  forDate?: Date;
  mealType: 'breakfast' | 'lunch' | 'dinner';
  votedBy: mongoose.Types.ObjectId[];
  createdAt: Date;
}

const MenuSuggestionSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  dishName: { type: String, required: true },
  description: { type: String },
  votes: { type: Number, default: 1 },
  hostelBlock: { type: String, required: true },
  forDate: { type: Date },
  mealType: { type: String, enum: ['breakfast', 'lunch', 'dinner'], required: true },
  votedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.MenuSuggestion || mongoose.model<IMenuSuggestion>('MenuSuggestion', MenuSuggestionSchema);