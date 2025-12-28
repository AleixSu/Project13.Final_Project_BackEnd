const { isAuth, allowRoles } = require('../../middlewares/authorization/auth')
const upload = require('../../middlewares/cloudinary/file')
const {
  getEvents,
  getEventByID,
  createEvent,
  updateEventInfo,
  deleteEvent,
  signUpToEvent,
  getEventByLocation,
  cancelEventSignUp
} = require('../controllers/event')

const eventRoutes = require('express').Router()

eventRoutes.get('/', getEvents)
eventRoutes.get('/location/:locations', getEventByLocation)
eventRoutes.get('/:id', getEventByID)
eventRoutes.post(
  '/',
  [
    isAuth,
    allowRoles('admin'),
    upload.fields([
      { name: 'eventImg', maxCount: 1 },
      { name: 'eventBgImg', maxCount: 1 }
    ])
  ],
  createEvent
)
eventRoutes.patch(
  '/:id',
  [
    isAuth,
    allowRoles('admin'),
    upload.fields([
      { name: 'eventImg', maxCount: 1 },
      { name: 'eventBgImg', maxCount: 1 }
    ])
  ],
  updateEventInfo
)
eventRoutes.patch('/:id/sign_up', isAuth, signUpToEvent)
eventRoutes.patch('/:id/unsign_up', isAuth, cancelEventSignUp)
eventRoutes.delete('/:id', [isAuth, allowRoles('admin')], deleteEvent)

module.exports = eventRoutes
