const { getArrays } = require('../seed/data/arraysData')

const seedHelper1 = async (insertedUsers) => {
  const { usersArray, locationsArray } = await getArrays()

  const dataUser = []

  for (const user of usersArray.array) {
    dataUser.push(user.nickName)
  }
  const userId = {}
  for (const user of insertedUsers) {
    if (dataUser.includes(user.nickName)) {
      userId[user.nickName] = user._id
    }
  }
  const result = userId

  const locationsSeed = []

  for (const location of locationsArray.array) {
    location.createdBy = result[location.createdBy] || location.createdBy
    locationsSeed.push(location)
  }

  return locationsSeed
}

const seedHelper2 = async (insertedLocations, insertedUsers) => {
  const { eventsArray } = await getArrays()

  const dataLocations = {}
  for (const location of insertedLocations) {
    dataLocations[location.country] = location._id
  }

  const dataUsers = {}
  for (const user of insertedUsers) {
    dataUsers[user.nickName] = user._id
  }

  const eventsSeed = []

  for (const event of eventsArray.array) {
    event.locationCountry =
      dataLocations[event.locationCountry] || event.locationCountry
    event.attendees = event.attendees
      .split(',')
      .map((name) => dataUsers[name.trim()] || name.trim())
    event.createdBy = dataUsers[event.createdBy] || event.createdBy

    eventsSeed.push(event)
  }

  return eventsSeed
}

const seedHelper3 = (insertedEvents) => {
  const userUpdates = []
  const locationUpdates = []

  for (const event of insertedEvents) {
    for (const attendeeId of event.attendees) {
      userUpdates.push({
        userId: attendeeId,
        eventId: event._id
      })
    }

    locationUpdates.push({
      locationId: event.locationCountry,
      eventId: event._id
    })
  }

  return { userUpdates, locationUpdates }
}

module.exports = { seedHelper1, seedHelper2, seedHelper3 }
