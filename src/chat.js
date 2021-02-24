let widgetEl = document.getElementById('webex-chat-widget');
// Init a new widget
webex.widget(widgetEl).spaceWidget({
  accessToken: 'YmYxZjA1MzUtZDg0Ni00MTQzLTkzOWUtZTllMDIzOTVmOGNjZjk2MjQwY2UtNzdj_PE93_cb22bf91-b84e-4c50-ab49-cd704940b921',
  destinationId: 'harshaaloga@gmail.com',
  destinationType: 'email',
  Activities: {
      files: false,
      meet: false,
      message: true,
      people: false
  },
  initialActivity: 'message'
  
});