import React from 'react';
import ContentEditable from 'react-contenteditable';

import {
  Provider,
  Connected,
  Connecting,
  Disconnected,
  Room,
  RequestUserMedia,
  RequestDisplayMedia,
  RemoteAudioPlayer,
  MediaControls,
  UserControls,
  Video,
  PeerList,
  GridLayout,
  ChatComposers,
  ChatList,
  ChatInput
} from '@andyet/simplewebrtc';

import {
  StyledUIContainer,
  StyledChatContainer,
  StyledChatInputContainer,
  StyledVideoContainer,
  StyledMessageMetadata,
  StyledMessage,
  StyledTimestamp,
  StyledToolbar,
  StyledTyping,
  StyledDisplayName,
  StyledMessageGroup,
  StyledMainContainer,
  StyledChatListContainer
} from './Styles';


const App = ({ configUrl, userData, roomName, roomPassword }) => (
  <Provider configUrl={configUrl} userData={userData}>
    {/*
       The <RemoteAudioPlayer/> plays all remote audio, muting as needed
       to reflect if the peer muted themselves, or you've muted them locally.
       See the action `disableMedia(trackId)`.

       It is possible to adjust the volume of each peer (by default it starts at 80%).
       See the action `limitPeerVolume(peerAddress, volumeLimit)`.

       It is also possible to pick the output device used to play sound.
       See the action `setAudioOutputDevice(deviceId)`
    */}
    <RemoteAudioPlayer />

    {/*
      The <Connecting/>, <Connected/>, <Disconnected/> components allow you to create
      UI based on the client connection state. They only render themselves when the
      client is in the corresponding state.
    */}

    <Connecting>
      <h1>Connecting...</h1>
    </Connecting>

    <Disconnected>
      <h1>Lost connection. Reattmpting to join...</h1>
    </Disconnected>

    <Connected>
      {/*
        Request user media. In this case we are requesting audio because we include
        the `audio` attribute. Video can be requested by including the `video` attribute.

        The `auto` attribute signals to request media immediately without any UI. If `auto`
        is not provided, a UI element is rendered which can be used to trigger the request.
      */}
      <RequestUserMedia audio video auto />

      {/*
        The <Room/> component triggers joining a room, which can include a media call and chat.

        The `name` property is *not* the identifier used for the room by other components. Instead,
        the room's messaging address is used. That can be found at `room.address`, where `room` is
        one of the properties passed to the child render function. The provided `name` value can later
        be found in `room.providedName`, but be aware that it is an unsanitized value if it can be
        set by a user.

        It is possible to lock rooms, in which case the `password` property must be set in order
        to join. See the actions `lockRoom(roomAddress, password)` and `unlockRoom(roomAddress)`.
      */}
      <Room name={roomName} password={roomPassword}>
        {({ room, peers, localMedia, remoteMedia }) => {
          if (!room.joined) {
            return <h1>Joining room...</h1>;
          }

          const remoteVideos = remoteMedia.filter(m => m.kind === 'video');
          const localVideos = localMedia.filter(m => m.kind === 'video' && m.shared);
          const localScreens = localVideos.filter(m => m.screenCapture);

          return (
            <StyledUIContainer>
              <StyledToolbar>
                <h1>{room.providedName}</h1>
                <div>
                  <span>{peers.length} Peer{peers.length !== 1 ? 's' : ''}</span>
                  <PeerList room={room.address} speaking render={({ peers }) => {
                    if (peers.length === 0) {
                      return null;
                    }
                    return (<span> ({peers.length} speaking)</span>);
                  }} />
                </div>
                <div>
                  {/*
                    The <RequestDisplayMedia/> component will trigger a screen/application selector
                    in supported browsers. Note that there is a difference in behaviour between
                    Chrome and Firefox. Chrome allows picking from both monitor screens and application
                    windows in the same prompt. Firefox only allows picking from either monitor screens
                    or application windows, not both.

                    Screensharing in Chrome requires an extension to be installed.
                  */}
                  {!!!localScreens.length && <RequestDisplayMedia />}

                  {/*
                    The <StopSharingLocalMedia/> component will remove a media track from being
                    shared with peers. It does not by default also end the media track, so that
                    it could be added again in the future.

                    Including the `autoRemove` attribute will end the unshared media track.
                  */}
                  {!!localScreens.length && <MediaControls media={localScreens[0]} autoRemove render={({ stopSharing }) => (
                    <button onClick={stopSharing}>Stop Screenshare</button>
                  )} />}
                </div>
                <UserControls render={({ user, isMuted, mute, unmute, setDisplayName }) => (
                  <div>
                    {/* A very basic method for setting a display name */}
                    <ContentEditable
                      className='display-name-editor'
                      html={user.displayName}
                      onChange={(event) => {
                        setDisplayName(event.target.value.trim());
                      }}
                    />
                    <button onClick={() => isMuted ? unmute() : mute()}>{isMuted ? 'Unmute' : 'Mute'}</button>
                  </div>
                )} />
              </StyledToolbar>

              <StyledMainContainer>
                <StyledVideoContainer>
                  <GridLayout
                    className='videogrid'
                    items={[...localVideos, ...remoteVideos]}
                    renderCell={(item) => (<Video media={item} />)}
                  />
                </StyledVideoContainer>

                <StyledChatContainer>
                  {/*
                    The <ChatList/> component provides chat messages for the given room, but
                    broken down into groups based on sender. The groups can also be based on
                    time, so that a single group only spans a given duration (e.g., 5 minutes), even
                    if it was the same sender for all of the chats.

                    To control the duration length, set `maxGroupDuration` to the number of seconds
                    that a group can span.

                    By default, the chat list is wrapped in a <StayDownContainer/> which keeps the
                    scrollable area pinned to the bottom as new messages are inserted, unless the
                    user has explicitly scrolled away from the bottom. That behavior can be changed
                    by providing a `render` function property to fully control the rendering instead
                    of using the `renderGroup` property.
                  */}
                  <ChatList
                    room={room.address}
                    className={StyledChatListContainer}
                    renderGroup={({ chats, peer }) => (
                      <StyledMessageGroup key={chats[0].id}>
                        <StyledMessageMetadata>
                          <StyledDisplayName>{peer.displayName ? peer.displayName : 'Anonymous'}</StyledDisplayName>{' '}
                          <StyledTimestamp>{chats[0].time.toLocaleTimeString()}</StyledTimestamp>
                        </StyledMessageMetadata>
                        {/*
                          There is an `acked` property on the message object that can be used
                          to show that a message has been received by the server (e.g. by changing from
                          rendering the body text in gray to black).
                        */}
                        {chats.map(message => (
                          <StyledMessage key={message.id}>{message.body}</StyledMessage>
                        ))}
                      </StyledMessageGroup>
                    )}
                  />
                  <StyledChatInputContainer>
                    {/*
                      The <ChatInput/> component is a basic textarea which will send the composed
                      message to the specified room address when the `Enter` key is pressed.

                      It will also generate and send typing notifications to the room.
                    */}
                    <ChatInput
                      room={room.address}
                      placeholder='Send a message...'
                    />

                    {/*
                      The <ChatComposers/> component simply receives a list of peers actively
                      typing in a given room. How you wish to display that information is up to you
                      with a custom `render` function property.
                    */}
                    <ChatComposers className={StyledTyping} room={room.address} />

                  </StyledChatInputContainer>
                </StyledChatContainer>

              </StyledMainContainer>
            </StyledUIContainer>
          );
        }}
      </Room>
    </Connected>
  </Provider>
);

export default App;
