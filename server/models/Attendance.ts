import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendance extends Document {
  userId: mongoose.Types.ObjectId;
  date: Date;
  isPresent: boolean;
  photoUrl?: string;
  latitude?: string;
  longitude?: string;
  markedAt: Date;
  reason?: string;
}

const AttendanceSchema: Schema = new Schema({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  isPresent: { type: Boolean, default: true },
  photoUrl: { type: String },
  latitude: { type: String },
  longitude: { type: String },
  markedAt: { type: Date, default: Date.now },
  reason: { type: String },
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

export default mongoose.models.Attendance || mongoose.model<IAttendance>('Attendance', AttendanceSchema);