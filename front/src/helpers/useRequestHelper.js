"use client";

import axios from "axios";
import _ from "lodash";
import Swal from "sweetalert2";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@auth/store/authStore";


const useRequestHelper = () => {
  const router = useRouter();

  const getRequestURL = (url) => {
    // En développement local, utiliser directement le backend
    // Les rewrites Next.js ne fonctionnent pas pour les requêtes client-side (Axios)
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      console.log("http://localhost:${process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST}${url}", process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST);
      return `${process.env.NEXT_PUBLIC_REMOTE_HOST_FROM_LOCALHOST}${url}`;
    }
    
    // En production, utiliser le préfixe /api (sera proxifié par nginx ou autre)
    return `/api${url}`;
  };

  const privateRequest = (url, options, config) => {
    // Lire le token à chaque appel pour avoir la valeur la plus récente
    const token = useAuthStore.getState().token;

    // Ne pas faire de requête si le token n'est pas disponible
    // Les vérifications enabled dans les hooks devraient empêcher cela,
    // mais c'est une sécurité supplémentaire
    if (!token) {
      return Promise.reject(new Error("Token not available"));
    }

    const tokenBearer = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    };

    const axiosInstance = axios.create({
      headers: tokenBearer.headers,
      ...config,
    });

    axiosInstance.interceptors.response.use(
      (response) => response,
      (err) => {
        if (err.response?.status === 401) { 
          router.push("/logout");
        }
        return Promise.reject(err);
      }
    );

    const requestURL = getRequestURL(url);
    return axiosInstance(requestURL, _.merge(options, tokenBearer));
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
