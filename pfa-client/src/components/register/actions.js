import {
  REGISTER,
  REGISTER_SUCCESS,
  REGISTER_FAIL,
  CLEAR_REGISTER_FAILED,
} from './constants';

export function register(email, password, currency) {
  return {
    type: REGISTER,
    email,
    password,
    currency,
  };
}

export function registerSuccess(payload) {
  return {
    type: REGISTER_SUCCESS,
    payload,
  };
}

export function registerFail(error) {
  return {
    type: REGISTER_FAIL,
    error,
  };
}

export function clearRegisterFailed() {
  return {
    type: CLEAR_REGISTER_FAILED,
  }
}

