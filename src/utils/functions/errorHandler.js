const errorHandler = (
  res,
  error,
  errorCode,
  action = 'complete the action'
) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => err.message)
    return res.status(400).json({ error: errors })
  } else {
    return res.status(errorCode).json({
      message: `An error ocurred while trying to ${action}. Try again`,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    })
  }
}

module.exports = errorHandler
