const { isAuth, allowRoles } = require('../../middlewares/authorization/auth')
const upload = require('../../middlewares/cloudinary/file')
const {
  getLocations,
  getLocationByID,
  createLocation,
  updateLocationInfo,
  deleteLocation,
  getCountries,
  getCountryByName
} = require('../controllers/location')

const locationRoutes = require('express').Router()

locationRoutes.get('/', getLocations)
locationRoutes.get('/countries', getCountries)
locationRoutes.get('/:id', getLocationByID)
locationRoutes.post(
  '/getLocationByName',
  isAuth,
  allowRoles('admin'),
  getCountryByName
)
locationRoutes.post(
  '/',
  [isAuth, allowRoles('admin'), upload.single('locationImg')],
  createLocation
)
locationRoutes.patch(
  '/:id',
  [isAuth, allowRoles('admin'), upload.single('locationImg')],
  updateLocationInfo
)
locationRoutes.delete('/:id', [isAuth, allowRoles('admin')], deleteLocation)

module.exports = locationRoutes
