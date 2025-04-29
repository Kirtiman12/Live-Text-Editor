
const { getTabContents } = require('../services/tab.service');

const getAllTabs = (req, res) => {
  const tabs = getTabContents();
  res.status(200).json({ tabs });
};

module.exports = {
  getAllTabs
};
