const cloudinary = require('cloudinary').v2

const connectCl = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUD_NAME,
      api_key: process.env.API_KEY,
      api_secret: process.env.API_SECRET
    })
    console.log('Connection to Cloudinary succesfully acomplished')
  } catch (error) {
    console.log('Connection to Cloudinary failed')
  }
}

module.exports = connectCl
