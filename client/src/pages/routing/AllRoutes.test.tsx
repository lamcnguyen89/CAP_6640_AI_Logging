import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AllRoutes from '../../pages/routing/AllRoutes';
import ProtectedRoute from '../../pages/routing/ProtectedRoute';

// Mock components to verify routing
vi.mock('../Home', () => ({ default: () => <div>Home Component</div> }));
vi.mock('../Dashboard', () => ({ default: () => <div>Dashboard Component</div> }));
vi.mock('../Settings', () => ({ default: () => <div>Settings Component</div> }));
vi.mock('../Account', () => ({ default: () => <div>Account Component</div> }));
vi.mock('../LogView', () => ({ default: () => <div>LogView Component</div> }));
vi.mock('../Admin', () => ({ default: () => <div>Admin Component</div> }));
vi.mock('../EmailVerify', () => ({ default: () => <div>EmailVerify Component</div> }));
vi.mock('../PageNotFound', () => ({ default: () => <div>Page Not Found Component</div> }));

// Mock the ProtectedRoute to verify protected routes
vi.mock('./ProtectedRoute', () => ({ default: ({ component: Component, ...rest }) => (
  <div>ProtectedRoute - {rest.path}</div>
) }));

describe('AllRoutes component', () => {
  it('should render the Admin component on "/vera-portal/manage/:projectId"', () => {
    render(
      <MemoryRouter initialEntries={['/vera-portal/manage/1']}>
        <AllRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('ProtectedRoute - /vera-portal/manage/:projectId')).toBeInTheDocument();
  });

  it('should render the LogView component on "/vera-portal/logs/:participantId"', () => {
    render(
      <MemoryRouter initialEntries={['/vera-portal/logs/123']}>
        <AllRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('ProtectedRoute - /vera-portal/logs/:participantId')).toBeInTheDocument();
  });

  it('should render the Dashboard component on "/vera-portal/dashboard"', () => {
    render(
      <MemoryRouter initialEntries={['/vera-portal/dashboard']}>
        <AllRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('ProtectedRoute - /vera-portal/dashboard')).toBeInTheDocument();
  });

  it('should render the Settings component on "/vera-portal/settings/:projectId"', () => {
    render(
      <MemoryRouter initialEntries={['/vera-portal/settings/1']}>
        <AllRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('ProtectedRoute - /vera-portal/settings/:projectId')).toBeInTheDocument();
  });

  it('should render the Account component on "/vera-portal/account"', () => {
    render(
      <MemoryRouter initialEntries={['/vera-portal/account']}>
        <AllRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('ProtectedRoute - /vera-portal/account')).toBeInTheDocument();
  });

  it('should render the PageNotFound component for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AllRoutes />
      </MemoryRouter>
    );

    expect(screen.getByText('Page Not Found Component')).toBeInTheDocument();
  });
});
