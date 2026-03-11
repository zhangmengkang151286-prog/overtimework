module.exports = {
  getInfoAsync: jest.fn((uri) => 
    Promise.resolve({
      size: 1024 * 1024, // 1MB
      exists: true,
      uri: uri
    })
  )
};
