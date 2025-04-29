
// Store tab contents
const tabContents = new Map();

// Get all tabs
const getTabContents = () => {
  return Array.from(tabContents.entries()).map(([id, content]) => ({
    id,
    content
  }));
};

// Get tab content by ID
const getTabContentById = (tabId) => {
  return tabContents.get(tabId) || '';
};

// Set tab content
const setTabContent = (tabId, content) => {
  tabContents.set(tabId, content);
};

// Delete tab content
const deleteTabContent = (tabId) => {
  tabContents.delete(tabId);
};

module.exports = {
  tabContents,
  getTabContents,
  getTabContentById,
  setTabContent,
  deleteTabContent
};
