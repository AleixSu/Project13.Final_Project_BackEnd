const Event = require('../../../api/models/event')
const Location = require('../../../api/models/location')
const User = require('../../../api/models/user')
const { loadAllData } = require('../../functions/CSV2Array')

const getArrays = async () => {
  const { arrayUsers, arrayLocations, arrayEvents } = await loadAllData()

  const usersArray = {
    name: 'Users Data',
    array: arrayUsers,
    model: User
  }

  const locationsArray = {
    name: 'Locations data',
    array: arrayLocations,
    model: Location
  }

  const eventsArray = {
    name: 'Events data',
    array: arrayEvents,
    model: Event
  }

  return { usersArray, locationsArray, eventsArray }
}

module.exports = { getArrays }
