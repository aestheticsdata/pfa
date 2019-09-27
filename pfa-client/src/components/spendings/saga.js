import { takeLatest, call, put, select } from 'redux-saga/effects';
import { privateRequest } from '../../helpers/requestHelper';
// import differenceInCalendarDays from 'date-fns/differenceInCalendarDays';
// import parseISO from 'date-fns/parseISO';
// import _ from 'lodash';

import {
  CREATE_SPENDING,
  UPDATE_SPENDING,
  DELETE_SPENDING,
  GET_SPENDINGS,
  GET_RECURRING,
  GET_USERS, DELETE_RECURRING,
} from './constants';

import {
  getSpendingsSuccess,
  getSpendings, getRecurringSuccess, getRecurring,
} from './actions';


import { displayPopup } from '../../helpers/swalHelper';
import { intl } from '../../index';
import messages from './messages';


export function* onGetUser() {
  try {
    yield call(privateRequest, '/users/all');
  } catch(err) {
    console.log('Main saga err', err);
    // if (err.response.status === 401) {
      // yield put(push('/logout'));
    // }
  }
}

export function* onCreateSpending(payload) {
  try {
    yield call(privateRequest, '/spendings/add', {
      method: 'POST',
      data: payload.spending,
    });
    displayPopup({ text: intl.formatMessage({ ...messages.createSuccess }) });
    const dateRange = yield select(state => state.dateRangeReducer.dateRange);
    yield put(getSpendings(payload.spending.userID, dateRange));
  } catch (err) {
    console.log('error while creating spending', err);
  }
}

export function* onUpdateSpending(payload) {
  try {
    const userID = JSON.parse(localStorage.getItem('pfa-user')).id;
    yield call(privateRequest, `/spendings/${payload.spending.id}`, {
      method: 'PUT',
      data: payload.spending,
    });
    displayPopup({ text: intl.formatMessage({ ...messages.updateSuccess }) });
    const dateRange = yield select(state => state.dateRangeReducer.dateRange);
    yield put(getSpendings(userID, dateRange));
  } catch (err) {
    console.log(err);
  }
}

export function* onDeleteSpending(payload) {
  try {
    yield call(privateRequest, `/spendings/${payload.id}`, {
      method: 'DELETE',
    });
    displayPopup({ text: intl.formatMessage({ ...messages.deleteSuccess }) });
    const userID = yield select(state => state.loginReducer.user.id);
    const dateRange = yield select(state => state.dateRangeReducer.dateRange);
    yield put(getSpendings(userID, dateRange));
  } catch (err) {
    console.log(`error while deleting spending :${err}`);
  }
}


export function* onGetSpendings(payload) {
  if (payload.dateRange.from) {
    try {
      const userID = JSON.parse(localStorage.getItem('pfa-user')).id;
      const res = yield call(privateRequest, `/spendings?userID=${userID}&from=${payload.dateRange.from}&to=${payload.dateRange.to}`);

      const dateRange = yield select(state => state.dateRangeReducer.dateRange.range);
      yield put(getSpendingsSuccess(res.data, dateRange));
    } catch (err) {
      console.log('error while getting spendings', err);
    }
  }
}

export function* onGetRecurring(payload) {
    try {
      const userID = JSON.parse(localStorage.getItem('pfa-user')).id;
      const res = yield call(privateRequest, `/recurrings?userID=${userID}`);

      const dateRange = yield select(state => state.dateRangeReducer.dateRange.range);
      yield put(getRecurringSuccess(res.data));
    } catch (err) {
      console.log('error while getting spendings', err);
    }
}

export function* onDeleteRecurring(payload) {
  try {
    yield call(privateRequest, `/recurrings/${payload.id}`, {
      method: 'DELETE',
    });
    displayPopup({ text: intl.formatMessage({ ...messages.deleteSuccess }) });
    const userID = yield select(state => state.loginReducer.user.id);
    const dateRange = yield select(state => state.dateRangeReducer.dateRange);
    yield put(getRecurring(userID, dateRange));
  } catch (err) {
    console.log(`error while deleting recurring :${err}`);
  }
}

export default function* defaultSaga() {
  yield takeLatest(GET_USERS, onGetUser);
  yield takeLatest(CREATE_SPENDING, onCreateSpending);
  yield takeLatest(GET_SPENDINGS, onGetSpendings);
  yield takeLatest(DELETE_SPENDING, onDeleteSpending);
  yield takeLatest(UPDATE_SPENDING, onUpdateSpending);
  yield takeLatest(GET_RECURRING, onGetRecurring);
  yield takeLatest(DELETE_RECURRING, onDeleteRecurring);
}