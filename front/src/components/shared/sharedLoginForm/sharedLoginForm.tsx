"use client";

import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { Field, Formik } from "formik";
// import { validationHelper } from './helpers/validationHelper';
import getSymbolFromCurrency from "currency-symbol-map";
import currencyCodes from "@src/currency-codes.json";
import type { SharedLoginFormProps } from "@src/components/shared/sharedLoginForm/interfaces";

const SharedLoginForm = ({
  onSubmit,
  buttonTitle,
  displayEmailField,
  displayPasswordField,
  displayCurrencyField,
}: SharedLoginFormProps) => {
  const [showPassword, setShowPassword] = useState(false);
  // const { validateEmail, validatePassword } = validationHelper();

  const getCurrenciesList = () => {
    return currencyCodes.map((currency) => (
      <option key={currency.code} value={currency.code}>
        {currency.name} : {getSymbolFromCurrency(currency.code)}
      </option>
    ));
  };

  return (
    <div className="flex w-full flex-col items-center space-y-8 text-formsGlobalColor">
      <div className="text-4xl font-thin">Personal Finance Assistant</div>
      <Formik
        initialValues={{ email: "", password: "", currency: "EUR" }}
        // @ts-ignore
        onSubmit={onSubmit}
      >
        {({ isSubmitting, errors, handleSubmit }) => (
          <form onSubmit={handleSubmit} className="flex w-full flex-col items-center space-y-8">
            {displayEmailField ? (
              <>
                <Field
                  type="email"
                  name="email"
                  placeholder="email"
                  className="w-11/12 border-b border-b-formsGlobalColor bg-transparent px-2 text-xl placeholder-grey2
                  outline-hidden focus:border-b-2"
                  // validate={validateEmail}
                />
                {errors.email && <div>{errors.email}</div>}
              </>
            ) : null}
            {displayPasswordField ? (
              <div className="relative w-11/12">
                <Field
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="password"
                  className="w-full border-b border-b-formsGlobalColor bg-transparent px-2 text-xl placeholder-grey2
                  outline-hidden focus:border-b-2"
                  // validate={validatePassword}
                />
                {errors.password && <div>{errors.password}</div>}
                <span
                  className="absolute right-2 bottom-1 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <FontAwesomeIcon icon={faEyeSlash} />
                  ) : (
                    <FontAwesomeIcon icon={faEye} />
                  )}
                </span>
              </div>
            ) : null}
            {displayCurrencyField ? (
              <>
                <Field component="select" name="currency">
                  {getCurrenciesList()}
                </Field>
              </>
            ) : null}
            <button
              type="submit"
              // @ts-ignore
              disabled={isSubmitting || errors.email || errors.password}
              className="h-8 w-11/12 rounded border border-formsGlobalColor bg-grey01alpha text-2xl
                font-medium uppercase text-formsGlobalColor transition-all hover:text-formsGlobalColorHover
                hover:shadow-login focus:outline-hidden"
            >
              {buttonTitle}
            </button>
          </form>
        )}
      </Formik>
    </div>
  );
};

export default SharedLoginForm;
