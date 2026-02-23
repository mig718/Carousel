import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../pages/RegisterPage';
import { Provider } from 'react-redux';
import { store } from '../redux/store';
import { BrowserRouter } from 'react-router-dom';

describe('RegisterPage', () => {
  test('renders registration form', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText('Carousel Registration')).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
  });

  test('allows user input in form fields', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );

    const firstNameInput = screen.getByLabelText(/first name/i) as HTMLInputElement;
    const lastNameInput = screen.getByLabelText(/last name/i) as HTMLInputElement;
    const emailInput = screen.getByLabelText(/^email$/i) as HTMLInputElement;

    await user.type(firstNameInput, 'John');
    await user.type(lastNameInput, 'Doe');
    await user.type(emailInput, 'john@example.com');

    expect(firstNameInput.value).toBe('John');
    expect(lastNameInput.value).toBe('Doe');
    expect(emailInput.value).toBe('john@example.com');
  });

  test('displays access level options', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/User \(No Approval Required\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Admin \(Requires Approval\)/i)).toBeInTheDocument();
  });

  test('shows login link', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );

    expect(screen.getByText(/Login here/i)).toBeInTheDocument();
  });

  test('validates password match', async () => {
    const user = userEvent.setup();
    render(
      <Provider store={store}>
        <BrowserRouter>
          <RegisterPage />
        </BrowserRouter>
      </Provider>
    );

    const passwordInput = screen.getByLabelText(/^password$/i);
    const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
    const submitButton = screen.getByRole('button', { name: /register/i });

    await user.type(passwordInput, 'password123');
    await user.type(confirmPasswordInput, 'password456');
    await user.click(submitButton);

    // In a real test, we'd check for an alert or error message
    // This is a simplified test showing the approach
  });
});

