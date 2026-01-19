const deleteFile = require('../../utils/functions/deleteFile')
const errorHandler = require('../../utils/functions/errorHandler')
const { generateSign } = require('../../utils/token/jwt')
const Event = require('../models/event')
const User = require('../models/user')
const bcrypt = require('bcrypt')

const register = async (req, res, next) => {
  try {
    const { nickName, email, password } = req.body
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: 'The password must have at least 8 characters' })
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password)) {
      return res.status(400).json({
        error:
          'The password must have at least 1 uppercase and 1 lowercase letter'
      })
    }
    if (!/\d/.test(password)) {
      return res
        .status(400)
        .json({ error: 'The password must have at least 1 number' })
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      return res
        .status(400)
        .json({ error: 'The password must have at least 1 special character' })
    }
    const nickNameDuplicated = await User.findOne({ nickName })
    const emailDuplicated = await User.findOne({ email })

    if (nickNameDuplicated || emailDuplicated) {
      return res.status(400).json({
        error: nickNameDuplicated
          ? 'This nickName is already taken, try another one.'
          : 'A user with this email already exists.'
      })
    }
    const newUser = new User(req.body)
    newUser.profileImg = req.file ? req.file.path : null

    const userRegistered = await newUser.save()
    return res.status(201).json(userRegistered)
  } catch (error) {
    console.log(error)
    if (req.file?.path) await deleteFile(req.file.path)
    return errorHandler(res, error, 500, 'register your profile')
  }
}

const login = async (req, res, next) => {
  try {
    const user = await User.findOne({ email: req.body.email }).populate(
      'attendingEvents'
    )
    if (user) {
      if (bcrypt.compareSync(req.body.password, user.password)) {
        const token = generateSign(user._id)
        const { password, ...safeUser } = user.toObject() // extraemos el password guardando el resto en safeUser para luego al retornar que no devuelva el password.
        return res.status(200).json({ user: safeUser, token })
      } else {
        if (req.file?.path) await deleteFile(req.file.path)
        return res.status(401).json('User or password incorrect')
      }
    } else {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(401).json('User or password incorrect')
    }
  } catch (error) {
    console.log(error)
    if (req.file?.path) await deleteFile(req.file.path)
    return errorHandler(res, error, 500, 'log in')
  }
}

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate({
        path: 'attendingEvents',
        populate: [
          { path: 'attendees', select: 'nickName name email profileImg' },
          { path: 'locationCountry' },
          { path: 'createdBy', select: 'name email profileImg' }
        ]
      })

    return res.status(200).json(user)
  } catch (error) {
    return errorHandler(res, error, 500, 'get profile data')
  }
}

const getUsers = async (req, res, next) => {
  try {
    const users = await User.find()
      .select('-password')
      .populate('attendingEvents')
      .lean()
    if (users.length === 0) {
      return res.status(404).json('No users have been found')
    } else {
      return res.status(200).json(users)
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get all users data')
  }
}

const getUserByID = async (req, res, next) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
      .select('-password')
      .populate('attendingEvents')
      .lean()
    if (!user) {
      return res.status(404).json('This user does not exist')
    } else {
      return res.status(200).json(user)
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'get the user by ID')
  }
}

const getUserByEmail = async (req, res, next) => {
  try {
    const { email, nickName } = req.body
    const user = await User.findOne({ email, nickName })
      .select('-password')
      .populate('attendingEvents')
      .lean()

    if (!user) {
      return res
        .status(404)
        .json({ error: 'User not found or credentials do not match' })
    }
    return res.status(200).json(user)
  } catch (error) {
    return errorHandler(res, error, 500, 'find the user you are looking for')
  }
}

const getUsersByNameOrNickname = async (req, res, next) => {
  try {
    const { searchQuery, name, nickName, eventId } = req.body

    const event = await Event.findById(eventId).populate('attendees')

    if (!event) {
      return res.status(404).json({ error: 'Event not found' })
    }

    const searchTerm = (searchQuery || name || nickName || '').toLowerCase()

    if (!searchTerm) {
      return res.status(400).json({ error: 'Please provide a search term' })
    }

    const users = event.attendees.filter(
      (user) =>
        user.name.toLowerCase().includes(searchTerm) ||
        user.nickName.toLowerCase().includes(searchTerm)
    )

    if (users.length === 0) {
      return res.status(404).json({ error: 'No users found' })
    }

    return res.status(200).json(users)
  } catch (error) {
    return errorHandler(res, error, 500, 'find users')
  }
}

const updateUserInfo = async (req, res, next) => {
  try {
    const { id } = req.params
    const oldUser = await User.findById(id)
    if (!oldUser) {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(404).json('User not found')
    }
    if (req.user._id.toString() !== id && req.user.role !== 'admin') {
      if (req.file?.path) await deleteFile(req.file.path)
      return res.status(401).json('You are not authorized')
    }
    const updateData = {
      nickName: req.body.nickName,
      name: req.body.name,
      frstSurname: req.body.frstSurname,
      scndSurname: req.body.scndSurname,
      birthDate: req.body.birthDate,
      location: req.body.location,
      email: req.body.email,
      gender: req.body.gender
    }
    if (req.body.password) {
      const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/

      if (!passwordRegex.test(req.body.password)) {
        if (req.file?.path) await deleteFile(req.file.path)
        return res
          .status(400)
          .json(
            'Password must have at least 8 characters, including one lowercase letter, one uppercase letter, one number, and one special character'
          )
      }
      updateData.password = bcrypt.hashSync(req.body.password, 10)
    }

    if (req.user.role === 'admin' && req.body.role) {
      updateData.role = req.body.role
    }

    if (req.file) updateData.profileImg = req.file.path

    if (req.body.nickName && req.body.nickName !== oldUser.nickName) {
      const nickNameExists = await User.findOne({ nickName: req.body.nickName })
      if (nickNameExists) {
        if (req.file?.path) await deleteFile(req.file.path)

        return res.status(400).json('This nickName is already taken')
      }
    }
    if (req.body.email && req.body.email !== oldUser.email) {
      const emailExists = await User.findOne({ email: req.body.email })
      if (emailExists) {
        if (req.file?.path) await deleteFile(req.file.path)
        return res.status(400).json('This email is already taken')
      }
    }

    if (req.file && oldUser.profileImg) await deleteFile(oldUser.profileImg)

    const userUpdated = await User.findByIdAndUpdate(id, updateData, {
      new: true
    })

    return res.status(200).json(userUpdated)
  } catch (error) {
    console.log(error)
    if (req.file?.path) await deleteFile(req.file.path)
    return errorHandler(res, error, 500, 'update the user info')
  }
}

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params

    if (req.user._id.toString() === id || req.user.role === 'admin') {
      const userDeleted = await User.findByIdAndDelete(id)
      if (!userDeleted) {
        return res.status(404).json('User not found')
      } else {
        if (userDeleted.profileImg) {
          try {
            await deleteFile(userDeleted.profileImg)
          } catch (fileError) {
            console.log('Error deleting profile image:', fileError)
            // No retornamos error, el usuario ya fue eliminado exitosamente
          }
        }
        return res.status(200).json(userDeleted)
      }
    } else {
      return res.status(401).json('You are not authorized')
    }
  } catch (error) {
    console.log(error)
    return errorHandler(res, error, 500, 'delete the user')
  }
}

module.exports = {
  login,
  register,
  getProfile,
  getUsers,
  getUserByID,
  getUserByEmail,
  getUsersByNameOrNickname,
  updateUserInfo,
  deleteUser
}
