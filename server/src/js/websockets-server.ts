import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

/**
 * Sends a bunch of random components to front-end every 10 seconds
 */

const PORT = 3001;

const components = [
  { name: 'Input', label: 'Enter your name' },
  { name: 'Input', label: 'Enter your email' },
  { name: 'Input', label: 'Enter your phone' },
  { name: 'Checkbox', label: 'Subscribe to newsletter' },
  { name: 'Checkbox', label: 'Accept terms and conditions' },
  { name: 'Checkbox', label: 'Enable notifications' },
  { name: 'Select', label: 'Select your country' },
  { name: 'Select', label: 'Choose your language' },
  { name: 'Select', label: 'Pick your timezone' },
  { name: 'Radio', label: 'Select gender' },
  { name: 'Radio', label: 'Choose subscription plan' },
  { name: 'Radio', label: 'Select delivery method' },
  { name: 'Button', label: 'Submit' },
  { name: 'Button', label: 'Cancel' },
  { name: 'Button', label: 'Save' }
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
      type: 'render-components',
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
