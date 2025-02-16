const axios=require('axios')
exports.filterObj = (obj, ...allowedFields) => {
  const newObj = {};
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el];
  });
  return newObj;
};

exports.createMeeting = async (email, payload,access_token) => {
  const { data } = await axios({
    url: `https://api.zoom.us/v2/users/${email}/meetings`,
    method: 'post',
    data: payload,
    headers: {
      Authorization: `Bearer ${access_token}`
    }
  }).then(response=>{
    return response;
  }).catch(error=>{
    if(error.data)return error.data;
    return 'Something went wrong'
  })
  return data;
};
