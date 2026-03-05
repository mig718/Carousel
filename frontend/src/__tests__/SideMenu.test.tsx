import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import SideMenu from '../components/SideMenu';
import { store } from '../redux/store';

jest.mock('../services/userService', () => ({
  auditService: {
    trackLogout: jest.fn(async () => undefined),
  },
  roleService: {
    getRolesForUser: jest.fn(async () => []),
  },
  userService: {
    getCurrentUser: jest.fn(async () => ({
      id: 'user-1',
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      accessLevel: 'User',
    })),
  },
}));

describe('SideMenu', () => {
  beforeEach(() => {
    localStorage.setItem('email', 'test@example.com');
  });

  afterEach(() => {
    localStorage.clear();
  });

  test('renders Flows navigation link', () => {
    render(
      <Provider store={store}>
        <MemoryRouter>
          <SideMenu />
        </MemoryRouter>
      </Provider>
    );

    expect(screen.getByRole('link', { name: /flows/i })).toBeTruthy();
  });
});
