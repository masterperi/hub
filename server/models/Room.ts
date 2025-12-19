import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  roomNumber: string;
  hostelBlock: string;
  capacity: number;
  currentOccupancy: number;
}

const RoomSchema: Schema = new Schema({
  roomNumber: { type: String, required: true },
  hostelBlock: { type: String, required: true },
  capacity: { type: Number, default: 4 },
  currentOccupancy: { type: Number, default: 0 },
  //  testing comment
});

export default mongoose.models.Room || mongoose.model<IRoom>('Room', RoomSchema);