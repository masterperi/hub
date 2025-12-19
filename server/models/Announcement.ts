import mongoose, { Document, Schema } from 'mongoose';

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  isEmergency: boolean;
  isHoliday: boolean;
  block?: string; // Optional for global, or specific block
  hostelBlock?: string; // Keeping consistent with other models
  createdAt: Date;
}

const AnnouncementSchema: Schema = new Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  isEmergency: { type: Boolean, default: false },
  isHoliday: { type: Boolean, default: false },
  hostelBlock: { type: String }, // If null/undefined, it's for everyone
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Announcement || mongoose.model<IAnnouncement>('Announcement', AnnouncementSchema);