import mongoose, { Schema, Document } from "mongoose";

export interface IHostelSettings extends Document {
    hostelBlock: string;
    leaveWindowFrom: Date | null;
    leaveWindowTo: Date | null;
    leaveWindowLabel: string;
    updatedBy: mongoose.Types.ObjectId;
}

const HostelSettingsSchema = new Schema({
    hostelBlock: { type: String, required: true, unique: true },
    leaveWindowFrom: { type: Date, default: null },
    leaveWindowTo: { type: Date, default: null },
    leaveWindowLabel: { type: String, default: "" },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'User' }
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

export default mongoose.models.HostelSettings || mongoose.model<IHostelSettings>("HostelSettings", HostelSettingsSchema);
