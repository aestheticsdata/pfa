import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
  Formik,
  Form,
  Field,
} from 'formik';

import {
  getSpendings,
} from './actions';

import StyledSpendings from './StyledSpendings';

import SpendingDayItem from './spendingDayItem/SpendingDayItem';

import {
  createSpending,
} from './actions';

class Spendings extends Component {
  componentDidMount() {
    // this.props.getSpendings(this.props.user.id, this.props.dateRange);
  }

  onSubmit = (values, { setSubmitting }) => {
    const spending = {
      date: values.date,
      label: values.label,
      amount: values.amount,
      category: values.category,
      currency: this.props.user.baseCurrency,
      userID: this.props.user.id,
    };

    this.props.createSpending(spending);
    setSubmitting(false);
  };

  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.props.dateRange !== prevProps.dateRange) {
      this.props.getSpendings(this.props.user.id, this.props.dateRange);
    }
  }

  render() {
    return (
      <StyledSpendings>
        <Formik
          initialValues={{
            date: '',
            label: '',
            amount: '',
            category: '',
          }}
          onSubmit={this.onSubmit}
        >
          {({ isSubmitting, errors }) => (
            <Form>
              <Field
                type="date"
                name="date"
                placeholder="date"
              />
              <Field
                type="text"
                name="label"
                placeholder="label"
              />
              <Field
                type="number"
                name="amount"
                placeholder="amount"
              />
              <Field
                type="text"
                name="category"
                placeholder="category"
              />
              <button
                type="submit"
                disabled={isSubmitting || errors.email || errors.password}
                className="shared-login-submit-btn"
              >
                Create spending
              </button>
            </Form>
          )}
        </Formik>
        <div className="spendings-list">
        {
          this.props.spendings.length > 0 ?
            <div className="list-container">

                {
                  this.props.spendings.map((spending, i) => (
                    <SpendingDayItem
                      key={i}
                      spending={spending}
                    />
                  ))
                }
            </div>
            :
            null
        }
        </div>
      </StyledSpendings>
    );
  }
}

const mapStateToProps = (state) => {
  return {
    token: state.loginReducer.token,
    user: state.loginReducer.user,
    spendings: state.spendingsReducer.spendings,
    dateRange: state.dateRangeReducer.dateRange,
  }
};

const mapDispatchToProps = (dispatch) => {
  return {
    getSpendings: (userID, dateRange) => dispatch(getSpendings(userID, dateRange)),
    createSpending: (spending) => dispatch(createSpending(spending)),
  };
};

export default connect(mapStateToProps, mapDispatchToProps)(Spendings);
