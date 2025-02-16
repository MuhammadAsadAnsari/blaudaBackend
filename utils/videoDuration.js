const { getVideoDurationInSeconds } = require("get-video-duration");


const getVideoDuration = async (url) => {
  try {
    let hours, minutes, seconds;
    const duration = await getVideoDurationInSeconds(url);
    const totalSeconds = Math.floor(duration);
    hours = Math.floor(totalSeconds / 3600);
    minutes = Math.floor(totalSeconds / 60);
    seconds = totalSeconds % 60;
    let time = `${hours > 0 ? `${hours}:` : ""} ${minutes}:${
      seconds.toString().length === 1 ? `0${seconds}` : seconds
    }`.replace(" ", "");
    return time;
  } catch (err) {
    return console.log("failed to get duration", err);
  }
};

module.exports = getVideoDuration;
