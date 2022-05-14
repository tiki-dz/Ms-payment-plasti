const { default: axios } = require('axios')

async function getEventById (id) {
  const response = await axios.get('http://localhost:5002/api/admin/event/' + id)
  return response.data
}
async function checkTokenClient (token) {
  const response = await axios.get('http://localhost:5001/api/tokenCheck', {
    headers: {
      'x-access-token': token,
      role: 'client',
      'Content-Type': 'application/json',
      'Access-Control-Allow-Headers': 'x-access-token'
    }
  })
  return response.data
}
module.exports = { getEventById, checkTokenClient }
