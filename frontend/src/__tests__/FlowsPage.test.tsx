import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, jest, test } from '@jest/globals';
import FlowsPage from '../pages/FlowsPage';

const mockNavigate = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('../services/userService', () => ({
  flowService: {
    getFlows: jest.fn(async () => []),
  },
}));

describe('FlowsPage', () => {
  afterEach(() => {
    mockNavigate.mockReset();
  });

  test('shows empty create graphic when no flows exist', async () => {
    render(
      <MemoryRouter>
        <FlowsPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getAllByText(/create flow/i).length).toBeGreaterThan(0);
    });
  });
});
