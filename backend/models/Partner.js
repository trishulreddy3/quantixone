const mongoose = require('mongoose');

const kycSchema = new mongoose.Schema({
    company_name: { type: String, required: true, minlength: 2, maxlength: 200 },
    contact_person_name: { type: String, required: true, minlength: 2, maxlength: 100 },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, minlength: 10, maxlength: 15 },
    aadhar_number: { type: String, required: true, length: 12 },
    pan_number: { type: String, required: true, length: 10 },
    gst_number: { type: String, maxlength: 15 },
    dpiit_number: { type: String, maxlength: 50 },
}, { _id: false });

const bankSchema = new mongoose.Schema({
    beneficiary_name: { type: String, required: true, minlength: 2, maxlength: 100 },
    account_number: { type: String, required: true, minlength: 9, maxlength: 18 },
    ifsc_code: { type: String, required: true, length: 11 },
    bank_name: { type: String, required: true, minlength: 2, maxlength: 100 },
    branch: { type: String, maxlength: 100 },
}, { _id: false });

const partnerSchema = new mongoose.Schema({
    kyc: { type: kycSchema, required: true },
    bank: { type: bankSchema, required: true },
    notes: { type: String },
    password: { type: String, required: true }, // Added for Auth
    status: {
        type: String,
        enum: ['pending_review', 'approved', 'contract_sent', 'active', 'suspended', 'terminated'],
        default: 'pending_review'
    },
    current_tier: { type: Number, default: 1 },
    total_orgs_referred: { type: Number, default: 0 },
    total_commissions_earned: { type: Number, default: 0 },
    total_commissions_paid: { type: Number, default: 0 },
}, { timestamps: true });

// Indexes for searching
partnerSchema.index({ "kyc.company_name": 'text', "kyc.email": 'text' });
partnerSchema.index({ status: 1 });

module.exports = mongoose.model('Partner', partnerSchema);
