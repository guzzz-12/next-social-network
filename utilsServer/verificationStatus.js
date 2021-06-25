const axios = require("axios")

const checkVerification = async (token) => {
  try {
    const res = await axios({
      method: "GET",
      url: `${process.env.BASE_URL}/api/profile/me/check-verification`,
      headers: {
        Cookie: `token=${token}`
      },
    });
    
    const {isVerified} = res.data.data;

    return isVerified;
    
  } catch (error) {
    throw new Error(error.message)
  }
}

module.exports = {
  checkVerification
};