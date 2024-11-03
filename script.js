const startButton = document.getElementById('start-button');
const stopButton = document.getElementById('stop-button');
const transcriptionDiv = document.getElementById('transcription');
const recordingIndicator = document.getElementById('recording-indicator');

let mediaRecorder;
let socket;

startButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);

function startRecording() {
  socket = new WebSocket('ws://localhost:8080'); // Connect to WebSocket server
  console.log("Connected to server")
  socket.onopen = () => {
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });

        mediaRecorder.ondataavailable = (event) => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log("audio sent")
            socket.send(event.data); // Send audio chunk to backend
          }
        };

        mediaRecorder.start(2000); // Record in small chunks (250 ms)
        startButton.disabled = true;
        stopButton.disabled = false;
        recordingIndicator.style.display = "block"; // Show recording indicator
      })
      .catch(error => {
        console.error("Error accessing microphone:", error);
      });
  };

  socket.onmessage = (event) => {
    transcriptionDiv.textContent = event.data + ' '; // Display transcribed text
    console.log("Text received"+ event.data)
  };

  socket.onerror = (error) => {
    console.error("WebSocket error:", error);
  };

  socket.onclose = () => {
    console.log("WebSocket connection closed");
  };
}

function stopRecording() {
  mediaRecorder.stop();
  socket.close();
  transcriptionDiv.textContent = '';
  startButton.disabled = false;
  stopButton.disabled = true;
  recordingIndicator.style.display = "none"; // Hide recording indicator
}
