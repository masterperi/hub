import mongoose, { Document, Schema } from 'mongoose';

export interface IRoomChangeRequest extends Document {
    userId: mongoose.Types.ObjectId;
    currentRoom: string;
    requestedRoom?: string; // Optional, they might just want "any" change
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    adminRemarks?: string;
    hostelBlock: string;
    createdAt: Date;
    updatedAt: Date;
}

const RoomChangeRequestSchema: Schema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    currentRoom: { type: String, required: true },
    requestedRoom: { type: String },
    reason: { type: String, required: true },
    status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
    adminRemarks: { type: String },
    hostelBlock: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
});

export default mongoose.models.RoomChangeRequest || mongoose.model<IRoomChangeRequest>('RoomChangeRequest', RoomChangeRequestSchema);
