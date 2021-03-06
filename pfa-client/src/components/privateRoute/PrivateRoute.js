import { Route, Redirect } from 'react-router-dom';

export const PrivateRoute = ({ component:Component, ...rest }) => (
    <Route
      {...rest}
      render={ props => (
        localStorage.getItem('pfa-token') ?
          <Component {...props} />
          :
          <Redirect to={{ pathname: '/login', state: { from: props.location } }} />
      )}
    />
);
