const mongoose = require('mongoose')

const locationSchema = new mongoose.Schema(
  {
    country: { type: String, required: true, trim: true },
    eventList: [{ type: mongoose.Types.ObjectId, ref: 'events' }],
    locationImg: { type: String, required: true },
    createdBy: { type: mongoose.Types.ObjectId, ref: 'users', required: true }
  },
  {
    timestamps: true,
    collection: 'locations'
  }
)

const Location = mongoose.model('locations', locationSchema, 'locations')

module.exports = Location
