import {
  Switch,
  Route,
} from 'react-router-dom';
import { ConnectedRouter } from 'connected-react-router';
import { Provider } from 'react-redux';

import store from './store';
import { history } from './history';

import GlobalStyle from './global-styles';

import NavBar from '@components/navbar/Navbar';
import Spendings from '@components/spendings/Spendings';
import Stats from '@components/stats/Stats';
import Login from '@components/login/Login';
import Register from '@components/register/Register';
import Logout from '@components/logout/Logout';
import ForgotPassword from '@components/forgotPassword/ForgotPassword';
import ChangePassword from '@components/changePassword/ChangePassword';
import NotFoundComponent from '@components/notFoundComponent/NotFoundComponent';

import { PrivateRoute } from '@components/privateRoute/PrivateRoute';


const App = () => (
  <Provider store={store}>
    <div className="App">
      <GlobalStyle />
      <ConnectedRouter history={history}>
        <NavBar />
        <Switch>
          <PrivateRoute exact path="/" component={Spendings} />
          <PrivateRoute exact path="/stats" component={Stats} />
          <Route exact path="/login" component={Login}  />
          <Route exact path="/logout" component={Logout}  />
          <Route exact path="/register" component={Register} />
          <Route exact path="/forgotpassword" component={ForgotPassword} />
          <Route exact path="/changepassword" component={ChangePassword} />
          <Route exact path="*" component={NotFoundComponent} />
        </Switch>
      </ConnectedRouter>
    </div>
  </Provider>
);

export default App;
