const deleteFile = require('../../utils/functions/deleteFile')
const errorHandler = require('../../utils/functions/errorHandler')
const Location = require('../models/location')

const getLocations = async (req, res, next) => {
  try {
    const locations = await Location.find()
      .populate('eventList')
      .populate('createdBy')
    if (locations.length === 0) {
      return res.status(404).json("There's no locations to be found")
    } else {
      return res.status(200).json(locations)
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get the data')
  }
}
const getLocationByID = async (req, res, next) => {
  try {
    const { id } = req.params
    const location = await Location.findById(id)
      .populate('eventList')
      .populate('createdBy')
    if (!location) {
      return res.status(404).json('Location not found')
    } else {
      return res.status(200).json(location)
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get the location by ID')
  }
}

const getCountries = async (req, res, next) => {
  try {
    const countries = await Location.find({}, { _id: 1, country: 1 }) //1 para incluir el campo. 0 para excluirlo
    return res.status(200).json(countries)
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get the countries')
  }
}

const createLocation = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(401).json({ error: 'You are not authorized' })
    }

    const countryDuplicated = await Location.findOne({
      country: req.body.country
    })
    if (countryDuplicated) {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(400).json({ error: 'This country already exists' })
    }

    const newLocation = new Location({
      ...req.body,
      createdBy: req.user._id
    })
    if (req.file) newLocation.locationImg = req.file.path

    const locationCreated = await newLocation.save()
    return res
      .status(201)
      .json({ message: 'Location created successfully', data: locationCreated })
  } catch (error) {
    console.error(error)
    if (req.file?.path) await deleteFile(req.file.path)
    return errorHandler(res, error, 500, 'create a new location')
  }
}

const updateLocationInfo = async (req, res, next) => {
  try {
    const { id } = req.params
    const oldLocation = await Location.findById(id)
      .populate('eventList')
      .populate('createdBy')
    if (!oldLocation) {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(404).json('This location does not exist')
    }
    if (req.user.role !== 'admin') {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(401).json('You are not authorized')
    }

    const updateData = req.body
    if (req.file) updateData.locationImg = req.file.path
    if (req.file && oldLocation.locationImg)
      await deleteFile(oldLocation.locationImg)

    const locationUpdated = await Location.findByIdAndUpdate(id, updateData, {
      new: true
    })
    return res.status(200).json(locationUpdated)
  } catch (error) {
    console.log(error)
    if (req.file?.path) await deleteFile(req.file.path)
    return errorHandler(res, error, 500, 'update the location info')
  }
}

const deleteLocation = async (req, res, next) => {
  try {
    const { id } = req.params
    if (req.user.role !== 'admin') {
      return res.status(401).json('You are not authorized')
    } else {
      const locationDeleted = await Location.findByIdAndDelete(id)
      if (!locationDeleted) {
        return res.status(404).json('Location not found')
      } else {
        if (locationDeleted.locationImg) {
          await deleteFile(locationDeleted.locationImg)
        }
        return res.status(200).json(locationDeleted)
      }
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'delete this location')
  }
}

module.exports = {
  getLocations,
  getLocationByID,
  getCountries,
  createLocation,
  updateLocationInfo,
  deleteLocation
}
