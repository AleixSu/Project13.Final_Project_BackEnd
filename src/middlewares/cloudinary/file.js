const cloudinary = require('cloudinary').v2
const multer = require('multer')
const { CloudinaryStorage } = require('multer-storage-cloudinary')

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: (req, file) => {
    let folder = 'project13/general'

    if (file.fieldname === 'profileImg') folder = 'project13/profile_pictures'
    if (file.fieldname === 'eventImg') folder = 'project13/events_pictures'
    if (file.fieldname === 'locationImg') folder = 'project13/location_pictures'
    if (file.fieldname === 'eventBgImg') folder = 'project13/eventBg_pictures'

    return {
      folder,
      allowed_formats: ['jpg', 'png', 'jpeg', 'gif', 'webp']
    }
  }
})
const upload = multer({ storage: storage })
module.exports = upload
