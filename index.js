require('dotenv').config()
const express = require('express')
const cors = require('cors')
const connectCl = require('./src/config/cloudinary')
const connectDB = require('./src/config/db')
const userRoutes = require('./src/api/routes/user')
const eventRoutes = require('./src/api/routes/event')
const locationRoutes = require('./src/api/routes/location')

const app = express()
app.use(express.json())
app.use(cors())
connectCl()
connectDB()

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'Welcome to EventHub API',
    version: '1.0.0',
    endpoints: {
      users: '/api/v1/users',
      events: '/api/v1/events',
      locations: '/api/v1/locations'
    },
    documentation: 'https://github.com/AleixSu?tab=repositories'
  })
})

app.use('/api/v1/users', userRoutes)
app.use('/api/v1/events', eventRoutes)
app.use('/api/v1/locations', locationRoutes)

app.use((req, res, next) => {
  return res.status(404).json('Route not found')
})

app.listen(3000, () => {
  console.log('http://localhost:3000')
})
