import { defineMessages } from 'react-intl';

const scope = 'app.components.Spendings';

export default defineMessages({
  createSuccess: {
    id: `${scope}.createSuccess`,
    defaultMessage: 'New spending added',
  },
  updateSuccess: {
    id: `${scope}.updateSuccess`,
    defaultMessage: 'Update success',
  },
  deleteSuccess: {
    id: `${scope}.deleteSuccess`,
    defaultMessage: 'Delete success',
  },
  editModalButton: {
    id: `${scope}.editModalButton`,
    defaultMessage: 'Update',
  },
  createModalButton: {
    id: `${scope}.createModalButton`,
    defaultMessage: 'Create',
  },
  cancelModalButton: {
    id: `${scope}.cancelModalButton`,
    defaultMessage: 'Cancel',
  },
  confirmDeleteTitle: {
    id: `${scope}.confirmDeleteTitle`,
    defaultMessage: 'Confirm delete ?',
  },
  confirmDeleteCancelButton: {
    id: `${scope}.confirmDeleteCancelButton`,
    defaultMessage: 'Cancel',
  },
  confirmDeleteConfirmButton: {
    id: `${scope}.confirmDeleteConfirmButton`,
    defaultMessage: 'Delete',
  },
  recurrings: {
    id: `${scope}.recurrings`,
    defaultMessage: 'Recurrings',
  },
  currentWeekTotal: {
    id: `${scope}.currentWeekTotal`,
    defaultMessage: 'Current week total',
  },
  initialAmountSetSuccess: {
    id: `${scope}.initialAmountSetSuccess`,
    defaultMessage: 'Initial amount set',
  },
  initialAmount: {
    id: `${scope}.initialAmount`,
    defaultMessage: 'Initial amount',
  },
  remaining: {
    id: `${scope}.remaining`,
    defaultMessage: 'Remaining',
  },
  totalSpendingsOfMonth: {
    id: `${scope}.totalSpendingsOfMonth`,
    defaultMessage: 'Month Total',
  }
});