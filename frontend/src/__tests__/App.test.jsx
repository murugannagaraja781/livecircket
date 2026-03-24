import React from 'react';
import { render, screen } from '@testing-library/react';
import App from '../App';

describe('App Component', () => {
  it('renders correctly', () => {
    render(<App />);
    // Just a simple check to see if it renders without crashing
    // You can add more specific assertions based on your App's content
    expect(true).toBe(true);
  });
});
