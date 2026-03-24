import React from 'react';
import { render } from '@testing-library/react-native';
import { HomeScreen } from '../screens/HomeScreen';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import { AuthContext } from '../context/AuthContext';

const mockStore = configureStore([]);

describe('HomeScreen', () => {
  let store;

  beforeEach(() => {
    store = mockStore({
      matches: {
        live: [],
        upcoming: [],
        finished: [],
        loading: false,
      },
    });
  });

  const mockAuthContext = {
    logout: jest.fn(),
  };

  it('renders correctly', () => {
    const { getByText } = render(
      <Provider store={store}>
        <AuthContext.Provider value={mockAuthContext}>
          <HomeScreen navigation={{ navigate: jest.fn() }} />
        </AuthContext.Provider>
      </Provider>
    );

    expect(getByText('CRIC')).toBeTruthy();
  });
});
