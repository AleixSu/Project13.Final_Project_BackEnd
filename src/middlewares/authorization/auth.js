const User = require('../../api/models/user')
const { verifyJWT } = require('../../utils/token/jwt')

const isAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization
    if (!token) throw new Error('No token provided')

    const parsedToken = token.replace('Bearer ', '')
    const { id } = verifyJWT(parsedToken)

    let user = await User.findById(id)
    if (!user) {
      throw new Error('User not found')
    }

    user.password = null
    req.user = user

    next()
  } catch (error) {
    console.error('Auth error:', error.message)
    return res
      .status(401)
      .json('An error ocurred while trying to authorize the acces')
  }
}

const allowRoles =
  (...roles) =>
  (req, res, next) => {
    if (roles.includes(req.user.role)) {
      return next()
    } else {
      return res.status(401).json('Acces not granted')
    }
  }

module.exports = { isAuth, allowRoles }
