import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the setup screen with Classic Ludo title', () => {
  render(<App />);
  const titleElement = screen.getByText(/Classic Ludo/i);
  expect(titleElement).toBeInTheDocument();
});

test('renders start game button', () => {
  render(<App />);
  const startButton = screen.getByText(/Start Game/i);
  expect(startButton).toBeInTheDocument();
});
