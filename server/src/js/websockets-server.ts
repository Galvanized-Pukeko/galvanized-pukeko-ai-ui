import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

/**
 * Sends a bunch of random components to front-end every 10 seconds
 */

const PORT = 3001;

const components = [
  { type: 'input', label: 'Enter your name' },
  { type: 'input', label: 'Enter your email' },
  { type: 'input', label: 'Enter your phone' },
  { type: 'checkbox', label: 'Subscribe to newsletter' },
  { type: 'checkbox', label: 'Accept terms and conditions' },
  { type: 'checkbox', label: 'Enable notifications' },
  { type: 'select', label: 'Select your country' },
  { type: 'select', label: 'Choose your language' },
  { type: 'select', label: 'Pick your timezone' },
  { type: 'radio', label: 'Select gender' },
  { type: 'radio', label: 'Choose subscription plan' },
  { type: 'radio', label: 'Select delivery method' },
  { type: 'button', label: 'Submit' },
  { type: 'button', label: 'Cancel' },
  { type: 'button', label: 'Save' }
];

function getRandomComponents(count: number) {
  const shuffled = [...components].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on('connection', (ws: WebSocket) => {
  console.log('Client connected');

  const sendRandomComponents = () => {
    const selectedComponents = getRandomComponents(3);
    const message = {
      type: 'form',
      components: selectedComponents
    };

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
      console.log('Sent components:', selectedComponents);
    }
  };

  // Send initial components immediately
  sendRandomComponents();

  // Send new components every 10 seconds
  const interval = setInterval(sendRandomComponents, 10000);

  ws.on('close', () => {
    console.log('Client disconnected');
    clearInterval(interval);
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    clearInterval(interval);
  });
});

server.listen(PORT, () => {
  console.log(`WebSocket server running on ws://localhost:${PORT}`);
});
