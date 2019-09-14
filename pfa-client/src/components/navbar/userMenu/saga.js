import { takeLatest, call, put } from 'redux-saga/effects';
import { privateRequest } from '../../../helpers/requestHelper';

import {
  CHANGE_BASE_CURRENCY
} from './constants';
import Swal from "sweetalert2";
import {intl} from '../../../index';
import messages from '../../changePassword/messages';

export function* onChangeBaseCurrency(payload) {
  const {
    userID,
    currency,
  } = payload;

  try {
    yield call(privateRequest, '/users/changebasecurrency', {
      method: 'POST',
      data: {
        userID,
        currency,
      }
    });
    Swal.fire({
      title: intl.formatMessage({ ...messages.changeBaseCurrencySuccessTitle }),
      text: intl.formatMessage({ ...messages.changeCurrencySuccessText }),
      type: 'success',
      toast: true,
      position: 'top-end',
      showConfirmButton: false,
      timer: 2000,
      onClose: () => {
        window.location.reload();
      },
    });
  } catch (err) {
    console.log(`could not change base currency: ${err}`);
  }
}

export default function* defaultSaga() {
  yield takeLatest(CHANGE_BASE_CURRENCY, onChangeBaseCurrency);
}
