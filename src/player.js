const myAccessToken = 'MTZjNzVlMmQtZmU1Ni00OTM0LWI5YWMtZDNlMGU3ZjQ1NGIxYTkzZjcwM2MtNjhi_PE93_0413f324-1a07-4840-878a-c3a46d92e693';

// Declare some globals that we'll need throughout
let activeMeeting, remoteShareStream, webex;

// First, let's wire our form fields up to localStorage so we don't have to
// retype things everytime we reload the page.

[
  'access-token',
].forEach((id) => {
  const el = document.getElementById(id);

  el.value = localStorage.getItem(id);
  el.addEventListener('change', (event) => {
    localStorage.setItem(id, event.target.value);
  });
});

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
          access_token: document.getElementById('access-token').value
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
          document.getElementById('connection-status').innerText = 'connected';
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
    document.getElementById('remote-screen').srcObject = remoteShareStream;
    document.getElementById('screenshare-tracks-remote').innerText = 'SHARING';
  });

  meeting.on('meeting:stoppedSharingRemote', () => {
    document.getElementById('remote-screen').srcObject = null;
    document.getElementById('screenshare-tracks-remote').innerText = 'STOPPED';
  });

  // Handle media streams changes to ready state
  meeting.on('media:ready', (media) => {
    if (!media) {
      return;
    }
    console.log(`MEDIA:READY type:${media.type}`);

    if (media.type === 'remoteVideo') {
      document.getElementById('remote-view-video').srcObject = media.stream;
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
          document.getElementById('call-status-local').innerText = memberObject.status;
        }
        else {
          document.getElementById('call-status-remote').innerText = memberObject.status;
        }
      }
    });
  });

  // Of course, we'd also like to be able to end the meeting:
  const leaveMeeting = () => meeting.leave();

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

    return meeting.getMediaStreams(mediaSettings);
  });
}



// Now, let's set up connection handling
document.getElementById('credentials').addEventListener('submit', (event) => {
  // let's make sure we don't reload the page when we submit the form
  event.preventDefault();

  // The rest of the connection setup happens in connect();
  connect();
});