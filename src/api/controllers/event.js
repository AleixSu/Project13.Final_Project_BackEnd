const deleteFile = require('../../utils/functions/deleteFile')
const errorHandler = require('../../utils/functions/errorHandler')
const Event = require('../models/event')
const Location = require('../models/location')
const User = require('../models/user')

const getEvents = async (req, res, next) => {
  try {
    const events = await Event.find()
      .populate('attendees', 'nickName name email profileImg')
      .populate('locationCountry')
      .populate('createdBy')
    if (events.length === 0) {
      return res.status(404).json("There's no events to be found")
    } else {
      return res.status(200).json(events)
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get the data')
  }
}

const getEventByID = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)
      .populate('attendees', 'nickName name email profileImg')
      .populate('locationCountry')
      .populate('createdBy')
    if (!event) {
      return res.status(404).json('Event not found')
    } else {
      return res.status(200).json(event)
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get the event by ID')
  }
}

const getEventByLocation = async (req, res, next) => {
  try {
    if (!req.params.locations) {
      return res.status(400).json('Missing location ids')
    }

    const ids = req.params.locations.split(',')

    const eventsByLocation = await Event.find({
      locationCountry: { $in: ids }
    })
      .populate('attendees', 'nickName name email profileImg')
      .populate('locationCountry')
      .populate('createdBy')

    if (eventsByLocation.length === 0) {
      return res.status(404).json("There aren't events in this location")
    }

    return res.status(200).json(eventsByLocation)
  } catch (error) {
    return errorHandler(res, error, 500, 'get the events for this location')
  }
}

const createEvent = async (req, res, next) => {
  try {
    delete req.body.currentAttendees
    if (req.user.role === 'admin') {
      const newEvent = new Event({
        ...req.body,
        createdBy: req.user._id,
        currentAttendees: 0
      })

      const eventDuplicated = await Event.findOne({
        eventName: req.body.eventName
      })
      if (eventDuplicated) {
        if (req.files?.eventImg) await deleteFile(req.files.eventImg[0].path)
        if (req.files?.eventBgImg)
          await deleteFile(req.files.eventBgImg[0].path)
        return res.status(400).json('This event already exists')
      } else {
        if (req.files?.eventImg) newEvent.eventImg = req.files.eventImg[0].path
        if (req.files?.eventBgImg)
          newEvent.eventBgImg = req.files.eventBgImg[0].path
        const eventCreated = await newEvent.save()
        await Location.findByIdAndUpdate(eventCreated.locationCountry, {
          $push: { eventList: eventCreated._id }
        })
        return res.status(201).json(eventCreated)
      }
    } else {
      if (req.files?.eventImg) await deleteFile(req.files.eventImg[0].path)
      if (req.files?.eventBgImg) await deleteFile(req.files.eventBgImg[0].path)
      return res.status(401).json('You are not authorized')
    }
  } catch (error) {
    console.log(error)
    if (req.files?.eventImg) await deleteFile(req.files.eventImg[0].path)
    if (req.files?.eventBgImg) await deleteFile(req.files.eventBgImg[0].path)
    return errorHandler(res, error, 500, 'create a new event')
  }
}

const updateEventInfo = async (req, res, next) => {
  try {
    const { id } = req.params
    const oldEvent = await Event.findById(id)
    if (!oldEvent) {
      if (req.files?.eventImg) await deleteFile(req.files.eventImg[0].path)
      if (req.files?.eventBgImg) await deleteFile(req.files.eventBgImg[0].path)
      return res.status(404).json('This event does not exist')
    }
    if (req.user.role !== 'admin') {
      if (req.files?.eventImg) await deleteFile(req.files.eventImg[0].path)
      if (req.files?.eventBgImg) await deleteFile(req.files.eventBgImg[0].path)
      return res.status(401).json('You are not authorized')
    }

    const updateData = { ...req.body }

    if (req.files?.eventImg) {
      updateData.eventImg = req.files.eventImg[0].path
      if (oldEvent.eventImg) await deleteFile(oldEvent.eventImg)
    }

    if (req.files?.eventBgImg) {
      updateData.eventBgImg = req.files.eventBgImg[0].path
      if (oldEvent.eventBgImg) await deleteFile(oldEvent.eventBgImg)
    }

    const eventUpdated = await Event.findByIdAndUpdate(id, updateData, {
      new: true
    })
      .populate('attendees', 'nickName name email profileImg')
      .populate('locationCountry')
      .populate('createdBy')
    return res.status(200).json(eventUpdated)
  } catch (error) {
    console.log(error)
    if (req.files?.eventImg) await deleteFile(req.files.eventImg[0].path)
    if (req.files?.eventBgImg) await deleteFile(req.files.eventBgImg[0].path)
    return errorHandler(res, error, 500, 'update the event info')
  }
}

const signUpToEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)

    if (!event) {
      return res.status(404).json({ message: 'Event not found' })
    }
    if (event.currentAttendees >= event.maxCapacity) {
      return res
        .status(409)
        .json('Sorry, this event has reached its max capacity')
    }
    if (event.attendees.some((a) => a.equals(req.user._id))) {
      // método de mongoose para comparar dos ObjectId
      return res.status(400).json('You are already signed up for this event')
    }
    const eventUpdated = await Event.findByIdAndUpdate(
      id,
      {
        $inc: { currentAttendees: 1 },
        $push: { attendees: req.user._id }
      },
      { new: true }
    )
      .populate('attendees', 'nickName name email profileImg')
      .populate('locationCountry')
      .populate('createdBy')

    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { attendingEvents: eventUpdated._id }
    })
    const updatedUser = await User.findById(req.user._id).populate(
      'attendingEvents'
    )

    return res.status(200).json({
      message: 'You have succesfully signed up to his event.',
      event: eventUpdated,
      user: updatedUser
    })
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'sign up to this event')
  }
}

const cancelEventSignUp = async (req, res, next) => {
  try {
    const { id } = req.params
    const event = await Event.findById(id)
    const indexEvent = event.attendees.findIndex((a) => a.equals(req.user._id))
    if (indexEvent === -1) {
      return res
        .status(400)
        .json({ messeage: 'You are not signed up for this event' })
    }
    event.attendees.splice(indexEvent, 1)
    event.currentAttendees = Math.max(0, event.currentAttendees - 1)
    const updatedEvent = await event.save()

    const user = await User.findById(req.user._id)
    const indexUser = user.attendingEvents.findIndex((a) => a.equals(event._id))
    if (indexUser === -1) {
      return res
        .status(404)
        .json({ message: 'You are not attending this event' })
    }
    user.attendingEvents.splice(indexUser, 1)
    const updatedUser = await user.save()

    return res.status(200).json({
      message: 'You have successfully canceled your sign up',
      event: updatedEvent,
      user: updatedUser
    })
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'unsign up from this event')
  }
}

const deleteEvent = async (req, res, next) => {
  try {
    const { id } = req.params
    if (req.user.role !== 'admin') {
      return res.status(401).json('You are not authorized')
    } else {
      //____________________
      const event = await Event.findById(id)
      const locationId = event.location
      const location = await Location.findById(locationId)
      const index = location.eventList.findIndex((a) => a.equals(event._id))
      if (index !== -1) {
        location.eventList.splice(index, 1)
        await location.save()
      }
      //____________________
      const eventDeleted = await Event.findByIdAndDelete(id)
      if (!eventDeleted) {
        return res.status(404).json('Event not found')
      } else {
        await deleteFile(eventDeleted.eventImg)
        return res.status(200).json(eventDeleted)
      }
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'delete this event')
  }
}

module.exports = {
  getEvents,
  getEventByID,
  getEventByLocation,
  updateEventInfo,
  createEvent,
  signUpToEvent,
  cancelEventSignUp,
  deleteEvent
}
