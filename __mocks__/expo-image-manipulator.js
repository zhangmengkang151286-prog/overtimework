module.exports = {
  manipulateAsync: jest.fn((uri, actions, options) => 
    Promise.resolve({
      uri: uri,
      width: 800,
      height: 600
    })
  ),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png'
  }
};
