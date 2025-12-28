require('dotenv').config()

const bcrypt = require('bcrypt')
const mongoose = require('mongoose')
const {
  seedHelper2,
  seedHelper1,
  seedHelper3
} = require('../functions/seedHelper')
const { getArrays } = require('./data/arraysData')

const launchSeed = async () => {
  const { usersArray, locationsArray, eventsArray } = await getArrays()

  try {
    console.log('Connection in process...')
    await mongoose.connect(process.env.DB_URL)
    console.log('Database connection established')

    await usersArray.model.deleteMany({})
    console.log('Old users collection removed from database')

    const hashedUser = []
    for (const user of usersArray.array) {
      user.password = bcrypt.hashSync(user.password, 10)
      hashedUser.push(user)
    }

    const insertedUsers = await usersArray.model.insertMany(hashedUser)

    console.log(`${usersArray.name} succesfully seeded`)

    await locationsArray.model.collection.drop()
    console.log('Old locations collection removed from database')
    const insertedLocations = await locationsArray.model.insertMany(
      await seedHelper1(insertedUsers)
    )
    console.log(`${locationsArray.name} succesfully seeded`)

    await eventsArray.model.collection.drop()
    console.log('Old events collection removed from database')

    const eventsToInsert = await seedHelper2(insertedLocations, insertedUsers)
    const insertedEvents = await eventsArray.model.insertMany(eventsToInsert)
    console.log(`${eventsArray.name} succesfully seeded`)

    const { userUpdates, locationUpdates } = seedHelper3(insertedEvents)

    for (const update of userUpdates) {
      await usersArray.model.updateOne(
        { _id: update.userId },
        { $push: { attendingEvents: update.eventId } }
      )
    }

    for (const update of locationUpdates) {
      await locationsArray.model.updateOne(
        { _id: update.locationId },
        { $push: { eventList: update.eventId } }
      )
    }

    console.log(`All collections successfully loaded and updated`)
  } catch (error) {
    console.log('Failed to connect to Database:' + error)
  } finally {
    await mongoose.disconnect()
    console.log('Database connection closed')
  }
}

launchSeed()
