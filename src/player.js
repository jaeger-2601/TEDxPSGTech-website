
// Declare some globals that we'll need throughout
let activeMeeting, remoteShareStream, remoteVideoStream, webex;


// There's a few different events that'll let us know we should initialize
// Webex and start listening for incoming calls, so we'll wrap a few things
// up in a function.
function connect() {
  return new Promise((resolve) => {
    if (!webex) {
      // eslint-disable-next-line no-multi-assign
      webex = window.webex = Webex.init({
        config: {
          logger: {
            level: 'debug'
          },
          meetings: {
            reconnection: {
              enabled: true
            }
          }
          // Any other sdk config we need
        },

        credentials: {
          access_token: 'YmYxZjA1MzUtZDg0Ni00MTQzLTkzOWUtZTllMDIzOTVmOGNjZjk2MjQwY2UtNzdj_PE93_cb22bf91-b84e-4c50-ab49-cd704940b921'
        }
      });
    }

    // Listen for added meetings
    webex.meetings.on('meeting:added', (addedMeetingEvent) => {
      if (addedMeetingEvent.type === 'INCOMING') {
        const addedMeeting = addedMeetingEvent.meeting;

        // Acknowledge to the server that we received the call on our device
        addedMeeting.acknowledge(addedMeetingEvent.type)
          .then(() => {
            
              joinMeeting(addedMeeting);
            
          
          });
      }
    });

    // Register our device with Webex cloud
    if (!webex.meetings.registered) {
      webex.meetings.register()
        // Sync our meetings with existing meetings on the server
        .then(() => webex.meetings.syncMeetings())
        .then(() => {
          // This is just a little helper for our selenium tests and doesn't
          // really matter for the example
          document.body.classList.add('listening');
          
          // Our device is now connected
          resolve();
        })
        // This is a terrible way to handle errors, but anything more specific is
        // going to depend a lot on your app
        .catch((err) => {
          console.error(err);
          // we'll rethrow here since we didn't really *handle* the error, we just
          // reported it
          throw err;
        });
    }
    else {
      // Device was already connected
      resolve();
    }
  });
}

// Similarly, there are a few different ways we'll get a meeting Object, so let's
// put meeting handling inside its own function.
function bindMeetingEvents(meeting) {
  // meeting is a meeting instance, not a promise, so to know if things break,
  // we'll need to listen for the error event. Again, this is a rather naive
  // handler.
  meeting.on('error', (err) => {
    console.error(err);
  });

  meeting.on('meeting:startedSharingRemote', () => {
    // Set the source of the video element to the previously stored stream
    document.getElementById('remote-view-video').srcObject = remoteShareStream;
    
  });

  meeting.on('meeting:stoppedSharingRemote', () => {
    document.getElementById('remote-view-video').srcObject = remoteVideoStream;
  });

  // Handle media streams changes to ready state
  meeting.on('media:ready', (media) => {
    if (!media) {
      return;
    }
    console.log(`MEDIA:READY type:${media.type}`);

    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = media.stream;
      remoteVideoStream = media.stream;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = media.stream;
    }
    if (media.type === 'remoteShare') {
      // Remote share streams become active immediately on join, even if nothing is being shared
      remoteShareStream = media.stream;
    }
 
  });

  // Handle media streams stopping
  meeting.on('media:stopped', (media) => {
    // Remove media streams

    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = null;
    }
    if (media.type === 'remoteAudio') {
      document.getElementById('remote-view-audio').srcObject = null;
    }

  });

  
  // Update participant info
  meeting.members.on('members:update', (delta) => {
    const {full: membersData} = delta;
    const memberIDs = Object.keys(membersData);

    memberIDs.forEach((memberID) => {
      const memberObject = membersData[memberID];

      // Devices are listed in the memberships object.
      // We are not concerned with them in this demo
      if (memberObject.isUser) {
        if (memberObject.isSelf) {
          console.log('call status local: ' + memberObject.status);
        }
        else {
          console.log('call status remote: ' + memberObject.status);
        }
      }
    });
  });


  meeting.on('all', (event) => {
    console.log(event);
  });
}


// Waits for the meeting to be media update ready
function waitForMediaReady(meeting) {
  return new Promise((resolve, reject) => {
    if (meeting.canUpdateMedia()) {
      resolve();
    }
    else {
      console.info('SHARE-SCREEN: Unable to update media, pausing to retry...');
      let retryAttempts = 0;

      const retryInterval = setInterval(() => {
        retryAttempts += 1;
        console.info('SHARE-SCREEN: Retry update media check');

        if (meeting.canUpdateMedia()) {
          console.info('SHARE-SCREEN: Able to update media, continuing');
          clearInterval(retryInterval);
          resolve();
        }
        // If we can't update our media after 15 seconds, something went wrong
        else if (retryAttempts > 15) {
          console.error('SHARE-SCREEN: Unable to share screen, media was not able to update.');
          clearInterval(retryInterval);
          reject();
        }
      }, 1000);
    }
  });
}

// Join the meeting and add media
function joinMeeting(meeting) {
  // Save meeting to global object
  activeMeeting = meeting;

  // Call our helper function for binding events to meetings
  bindMeetingEvents(meeting);

  return meeting.join().then(() => {
    const mediaSettings = {
      receiveVideo: true,
      receiveAudio: true,
      receiveShare: true,
      sendVideo: false,
      sendAudio: true,
      sendShare: false
    };

    return meeting.getMediaStreams(mediaSettings).then((mediaStreams) => {
      const [localStream, localShare] = mediaStreams;

      meeting.addMedia({
        localShare,
        localStream,
        mediaSettings
      });
    });
  });
}



// The rest of the connection setup happens in connect();
connect();


