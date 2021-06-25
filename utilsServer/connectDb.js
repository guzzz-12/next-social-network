const mongoose = require("mongoose");

const connectDb = async () => {
  if(mongoose.connection.readyState >= 1) {
    console.log("Database connection already stablished, no reconection required")
    return
  }

  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    console.log("Database connection intialized successfully");
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

module.exports = connectDb;
