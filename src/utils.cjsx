clicker = (fn) -> (e) ->
  e.preventDefault()
  fn e

withSuccess = (cb) -> (obj) ->
  if obj.data? and obj.returnCode is 0
    cb obj.data
  else
    console.warn JSON.stringify obj

exports.clicker = clicker
exports.withSuccess = withSuccess
