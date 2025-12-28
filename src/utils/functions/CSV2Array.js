const fs = require('fs').promises

async function loadAllData() {
  try {
    const dataEvents = await fs.readFile(
      'src/utils/seed/data/dataEvents.csv',
      'utf-8'
    )
    const arrayEvents = []
    const linesEvents = dataEvents.split(/\r?\n/).filter((line) => line.trim())
    const keysEvents = linesEvents[0].split(';')

    linesEvents.shift()
    for (const element of linesEvents) {
      let valuesArray = element.split(';')
      const object = {}
      for (let i = 0; i < valuesArray.length; i++) {
        object[keysEvents[i]] = valuesArray[i]
      }
      arrayEvents.push(object)
    }

    const dataLocations = await fs.readFile(
      'src/utils/seed/data/dataLocation.csv',
      'utf-8'
    )
    const arrayLocations = []
    const linesLocations = dataLocations
      .split(/\r?\n/)
      .filter((line) => line.trim())
    const keysLocations = linesLocations[0].split(';')

    linesLocations.shift()
    for (const element of linesLocations) {
      let valuesArray = element.split(';')
      const object = { eventList: [] }
      for (let i = 0; i < valuesArray.length; i++) {
        if (keysLocations[i] !== 'eventList') {
          object[keysLocations[i]] = valuesArray[i]
        }
      }
      arrayLocations.push(object)
    }

    const dataUsers = await fs.readFile(
      'src/utils/seed/data/dataUser.csv',
      'utf-8'
    )
    const arrayUsers = []
    const linesUsers = dataUsers.split(/\r?\n/).filter((line) => line.trim())
    const keysUsers = linesUsers[0].split(';')

    linesUsers.shift()
    for (const element of linesUsers) {
      let valuesArray = element.split(';')
      const object = { attendingEvents: [] }
      for (let i = 0; i < valuesArray.length; i++) {
        if (keysUsers[i] !== 'attendingEvents') {
          object[keysUsers[i]] = valuesArray[i]
        }
      }
      arrayUsers.push(object)
    }

    return { arrayEvents, arrayLocations, arrayUsers }
  } catch (error) {
    console.error('Error:', error)
    throw error
  }
}

module.exports = { loadAllData }
