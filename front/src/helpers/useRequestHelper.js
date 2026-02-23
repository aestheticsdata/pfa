"use client";

import axios from "axios";

// Set the default withCredentials to true for all axios requests
// This is necessary for the session cookie to be sent to the server
axios.defaults.withCredentials = true;

import _ from "lodash";
import { useRouter } from "next/navigation";
import { useUserStore } from "@auth/store/userStore";

const useRequestHelper = () => {
  const router = useRouter();

  const getRequestURL = (url) => {
    // Same URL structure in dev and prod: always use /api prefix.
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      return `${process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST}/api${url}`;
    }
    return `/api${url}`;
  };

  const privateRequest = (url, options, config) => {
    const user = useUserStore.getState().user;
    if (!user) {
      return Promise.reject(new Error("User not logged in"));
    }

    const axiosInstance = axios.create({
      withCredentials: true,
      ...config,
    });

    axiosInstance.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response?.status === 401) {
          useUserStore.getState().setUser(null);
        }
        return Promise.reject(err);
      }
    );

    const requestURL = getRequestURL(url);
    return axiosInstance(requestURL, _.merge(options, {}));
  };

  const request = (url, options) => {
    const requestURL = getRequestURL(url);
    return axios(requestURL, options);
  };

  return {
    request,
    privateRequest,
  };
};

export default useRequestHelper;
