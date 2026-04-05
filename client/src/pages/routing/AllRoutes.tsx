import React from 'react'
import { Switch, Route } from 'react-router-dom'
import PageNotFound from '../PageNotFound'
import ProtectedRoute from './ProtectedRoute'
import Settings from '../Settings'

const Home = React.lazy(() => import('../Home'))
const Dashboard = React.lazy(() => import('../Dashboard'))
const NewExperiment = React.lazy(() => import('../NewExperiment'))
const ExperimentDetails = React.lazy(() => import('../ExperimentDetails'))
const Documentation = React.lazy(() => import('../Documentation'))
const Account = React.lazy(() => import('../Account'))
const LogView = React.lazy(() => import('../LogView'))
const ImageView = React.lazy(() => import('../ImageView'))
const Admin = React.lazy(() => import('../Admin'))
const EmailVerify = React.lazy((() => import('../EmailVerify')))
const ResetPassword = React.lazy((() => import('../ResetPassword')))
const Authenticate = React.lazy((() => import('../Authenticate')))
const WebXRPlayer = React.lazy((() => import('../WebXRPlayer')))
const WebXRShortCode = React.lazy(() => import('../WebXRShortCode'))

const AllRoutes = () => (
  <Switch>
    <Route exact path="/vera-portal/" component={Home} />
    <Route path="/vera-portal/users/:id/verify/:token" component={EmailVerify} />
    <Route path="/vera-portal/users/:id/forgotpassword/:token" component={ResetPassword} />
    <Route path="/vera-portal/webxr/:experimentId" component={WebXRPlayer} />
    <ProtectedRoute path="/vera-portal/authenticate/" component={Authenticate} />
    <ProtectedRoute path="/vera-portal/manage/:experimentId" component={Admin} />
    <ProtectedRoute path="/vera-portal/settings/:experimentId" component={Settings} />
    <ProtectedRoute path="/vera-portal/logs/:participantId" component={LogView} />
    <ProtectedRoute path="/admin/images/:experimentId/:participantId" component={ImageView} />
    <ProtectedRoute path="/vera-portal/dashboard" component={Dashboard} />
    <ProtectedRoute path="/vera-portal/newexperiment" component={NewExperiment} />
    <ProtectedRoute path="/vera-portal/experimentdetails/:experimentId" component={ExperimentDetails} />
    <ProtectedRoute path="/vera-portal/documentation/:page" component={Documentation} />
    <ProtectedRoute path="/vera-portal/documentation" component={Documentation} />
    <ProtectedRoute path="/vera-portal/account" component={Account} />
    <ProtectedRoute path="/vera-portal/s/:shortCode" component={WebXRShortCode} />
    <Route component={PageNotFound} />
  </Switch>
)
AllRoutes.displayName = 'AllRoutes'
export default AllRoutes
